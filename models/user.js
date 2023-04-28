// import mongoose library
const mongoose = require("mongoose");
// create new schema object for user
const schema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    minLength: 3,
  },
  friends: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Person",
    },
  ],
});
// create a model called User from schema and export it
module.exports = mongoose.model("User", schema);
