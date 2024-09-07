import {v2 as cloudinary} from "cloudinary";

import Notification from "../models/notificationModel.js";
import Post from "../models/postModel.js";
import User from "../models/userModel.js";

// Create Post
export const createPost = async (req, res) => {
    try {
        const {text} = req.body;
        let {img} = req.body;
        const userId = req.user._id.toString();

        const user = await User.findById(userId);
        if(!user) {
            return res.status(404).json({message: "User not found"});
        }

        if(!text && !img) {
            return res.status(400).json({error: "Post must have text or image"});
        }

        // Upload to Cloudinary
        if(img) {
            const uploadedResponse = await cloudinary.uploader.upload(img);
            img = uploadedResponse.secure_url;
        }

        // Save to DB
        const newPost = new Post({
            user: userId,
            text,
            img

        });

        await newPost.save();
        res.status(201).json(newPost);


    } catch (error) {
        console.log("Error in createPost controller",error);
        res.status(500).json({error: "Internal sever error"});
    }
}

// Delete Post
export const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if(!post) {
            return res.status(404).json({message: "Post not found"});
        }

        // If post user and user trying to delete post is not same
        if(post.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({error: "You are not authorized to delete this post"});
        }

        // if post contains img then delete it from cloudinary
        if(post.img) {
            const imgId = post.img.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(imgId);
        }

        // delete post from DB
        await Post.findByIdAndDelete(req.params.id);

        res.status(200).json({message: "Post deleted successfully"});

    } catch (error) {
        console.log("Error in deletePost controller",error);
        res.status(500).json({error: "Internal sever error"});
        
    }
}


// Comment on Post
export const commentOnPost = async (req, res) => {
    try {
        const {text} = req.body;
        const postId = req.params.id;
        const userId = req.user._id;

        if(!text) {
            return res.status(400).json({message: "Text field is required"});
        }

        // find post in DB
        const post = await Post.findById(postId);
        // If no post
        if(!post) {
            return res.status(404).json({message: "Post not found"});
        }

        const comment = {user: userId, text}

        // push it to comments arrays of post in DB
        post.comments.push(comment);
        await post.save();

        res.status(200).json(post);

    } catch (error) {
        console.log("Error in commentOnPost controller",error);
        res.status(500).json({error: "Internal sever error"});
    }
}



// Like and Unlike post
export const likeUnlikePost = async (req, res) => {
    try {
        const userId = req.user._id;
        const {id:postId} = req.params;

        const post = await Post.findById(postId);

        if(!post) {
            return res.status(404).json({message: "Post not found"});
        }
        
        // Checking if user already liked the post
        const userLikedPost = post.likes.includes(userId);

        if (userLikedPost) {
            // Unlike the post
            await Post.updateOne({ _id:postId }, { $pull: {likes: userId }})
            // Remove from liked array 
            await User.updateOne({ _id: userId}, { $pull: { likedPosts: postId }})

            const updatedLikes = post.likes.filter((id) => id.toString() !== userId.toString());

            res.status(200).json(updatedLikes);
        } else {
            // Like the post and send notification
            post.likes.push(userId);
            await User.updateOne({ _id: userId }, { $push: { likedPosts: postId }})
            await post.save();

            const notification = new Notification({
                from: userId,
                to: post.user,
                type: "like"
            })

            await notification.save();

            const updatedLikes = post.likes;
            res.status(200).json(updatedLikes);
        }


    } catch (error) {
        console.log("Error in likeUnlikePost controller",error);
        res.status(500).json({error: "Internal sever error"});
    }
}


// Get all Posts
export const getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 }).populate({
            path: "user",
            select: "-password"
        })
        .populate({
            path: "comments.user",
            select: "-password"
        }) // gives latest post with user details like name and profilePic as well

        if(posts.length == 0) {
            return res.status(200).json([]);
        }

        res.status(200).json(posts);
    } catch (error) {
        console.log("Error in getAllPosts controller",error);
        res.status(500).json({error: "Internal sever error"});
    }
}


// To get All liked posts by a user
export const getLikedPosts = async (req, res) => {
    const userId = req.params.id;

    try {
        const user = await User.findById(userId);
        if(!user) {
            return res.status(404).json({message: "User not found"});
        }

        const likedPosts = await Post.find({ _id: {$in: user.likedPosts }})
        .populate({
            path: "user",
            select: "-password"
        }).populate({
            path: "comments.user",
            select: "-password"
        })

        res.status(200).json(likedPosts);
    } catch (error) {
        console.log("Error in getLikedPosts controller",error);
        res.status(500).json({error: "Internal sever error"});
    }
}


// To get Following people's post
export const getFollowingPosts = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        if(!user) {
            return res.status(404).json({message: "User not found"});
        }

        const following = user.following;

        const feedPosts = await Post.find({user: {$in: following}}).sort({ createdAt: -1 })
        .populate({
            path: "user",
            select: "-password"
        }).populate({
            path: "comments.user",
            select: "-password"
        })

        res.status(200).json(feedPosts);
    } catch (error) {
        console.log("Error in getFollowingPosts controller",error);
        res.status(500).json({error: "Internal sever error"});
    }
}


// To get user's posts
export const getUserPosts = async (req, res) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({username});
        if(!user) {
            return res.status(404).json({message: "User not found"});
        }

        const posts = await Post.find( { user: user._id }).sort({ createdAt: -1 })
        .populate({
            path: "user",
            select: "-password"
        }).populate({
            path: "comments.user",
            select: "-password"
        });

        res.status(200).json(posts);

    } catch (error) {
        console.log("Error in getUserPosts controller",error);
        res.status(500).json({error: "Internal sever error"});
    }
}

