import jwt from 'jsonwebtoken'
export default function generateToken(user){
   return jwt.sign({userId:user._id},process.env.JWT_SECRET,{expiresIn:'1d'})
}