import { NextResponse } from "next/server";
import dbConnect from "../../../lib/db";
import User from '../../../models/user'
import bcrypt from 'bcryptjs'
import jwt from "jsonwebtoken";
import generateToken from "../../../lib/generateToken";
import { cookies } from "next/headers";

export async function POST(request){
   try{
    await dbConnect();
    const data =await  request .json();
    const user = await User.findOne({email:data.email})
    if(user){
        return NextResponse.json({message:'YOU HAVE ALREADY REGISTERED'})
        
    }
    else{
        const hashedPassword = await bcrypt.hash(data.password,10)
      const newUser = await User.create({
                ...data,
                password: hashedPassword
                });
             const token = generateToken(newUser)
             
          const response = NextResponse.json({ message: 'Registration successful' });
            response.cookies.set('authToken', token, {
                httpOnly: true,
                // secure: process.env.NODE_ENV === 'production', // Enable HTTPS in the production environment
                sameSite: 'lax', // Prevent CSRF attacks
                maxAge:60*60*12,
                path: '/'
            });

            return response;
       
    }
   }
   catch(e){    
        return NextResponse.json({message:e.message})
   }

}