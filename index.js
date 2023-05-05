// Apollo Server
const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");
const { expressMiddleware } = require("@apollo/server/express4");
const {
  ApolloServerPluginDrainHttpServer,
} = require("@apollo/server/plugin/drainHttpServer");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const express = require("express");
const cors = require("cors");
const http = require("http");
// websocket server
const { WebSocketServer } = require("ws");
const { useServer } = require("graphql-ws/lib/use/ws");
// GraphQL
const { GraphQLError } = require("graphql");
// jwt for tokens and login
const jwt = require("jsonwebtoken");
// mongoose db
const mongoose = require("mongoose");
// mongoose setup
mongoose.set("strictQuery", false);
// model import
const Person = require("./models/person");
const User = require("./models/user");
// types and resolvers import
const typeDefs = require("./schema");
const resolvers = require("./resolvers");
// dotenv setup
require("dotenv").config();
// retrieve mongoDB URI from env file
const MONGODB_URI = process.env.MONGODB_URI;
// connect to MongoDB
console.log("Connecting to MongoDB...");

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((e) => console.log("error connection to MongoDB: ", e));

// setup is now within a function
const start = async () => {
  const app = express();
  const httpServer = http.createServer(app);
  // web socket server initialization
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/",
  });
  // schema
  const schema = makeExecutableSchema({ typeDefs, resolvers });
  const serverCleanup = useServer({ schema }, wsServer);

  const server = new ApolloServer({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
  });

  await server.start();

  app.use(
    "/",
    cors(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        const auth = req ? req.headers.authorization : null;
        if (auth && auth.startsWith("Bearer ")) {
          const decodedToken = jwt.verify(
            auth.substring(7),
            process.env.JWT_SECRET
          );
          const currentUser = await User.findById(decodedToken.id).populate(
            "friends"
          );
          return { currentUser };
        }
      },
    })
  );

  const PORT = 4000;

  httpServer.listen(PORT, () =>
    console.log(`Server is now running on http://localhost:${PORT}`)
  );
};

start();

// // Apollo Server
// const server = new ApolloServer({
//   typeDefs,
//   resolvers,
// });

// // start Apollo Server
// startStandaloneServer(server, {
//   listen: { port: 4000 },
//   context: async ({ req, res }) => {
//     const auth = req ? req.headers.authorization : null;
//     if (auth && auth.startsWith("Bearer ")) {
//       const decodedToken = jwt.verify(
//         auth.substring(7),
//         process.env.JWT_SECRET
//       );

//       const currentUser = await User.findById(decodedToken.id).populate(
//         "friends"
//       );
//       return { currentUser };
//     }
//   },
// }).then(({ url }) => {
//   console.log(`Server ready at ${url}`);
// });
