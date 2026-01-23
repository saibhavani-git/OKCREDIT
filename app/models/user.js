import mongoose from "mongoose";
import CreditCard from './cards.js'
const Schema = mongoose.Schema;


const UserSchema=new Schema({
    username:{
        type:String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
       // required: true
    },
    role:{
      type:String,
      enum:["user","admin"],
      default:"user"
    },
    cards:[
    {
      type: Schema.Types.ObjectId,
      ref: "CreditCard"
    }
  ]

})



export default mongoose.models.User || mongoose.model('User', UserSchema);