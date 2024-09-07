import Notification from "../models/notificationModel.js";





// To get all Notifications
export const getNotifications = async (req, res) => {
    try {
        const userId = req.user._id;

        const notifications = await Notification.find({ to:userId}).populate({
            path: "from",
            select: "username profileImg"
        });

        await Notification.updateMany({to:userId}, {read:true});

        res.status(200).json(notifications);
    } catch (error) {
        console.log("Error in getNotifications controller",error);
        res.status(500).json({error: "Internal sever error"});
    }
}


// To delete all Notifications
export const deleteNotifications = async (req, res) => {
    try {
        const userId = req.user._id;

        await Notification.deleteMany({to:userId});

        res.status(200).json({message: "Notifications deleted successfully"});
    } catch (error) {
        console.log("Error in deleteNotifications controller",error);
        res.status(500).json({error: "Internal sever error"});
    }
}

//to delete one notification *****This is not implemented *******
export const deleteOneNotification = async (req, res) => {
    try {
        const notificationId = req.params.id;
        const userId = req.user._id;

        const notification = await Notification.findById(notificationId);

        if(!notification) {
            return res.status(404).json({error: "Notification not found"});
        }

        if(notification.to.toString() !== usesId.toString()) {
            return res.status(403).json({error: "You are not allowed to delete this notification"});
        }

        await Notification.findByIdAndDelete(notificationId);

        res.status(200).json({message: "Notifications deleted successfully"});
    } catch (error) {
        console.log("Error in deleteNotifications controller",error);
        res.status(500).json({error: "Internal sever error"});
    }
}