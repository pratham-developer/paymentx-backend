const express = require('express');
const User = require('../models/UserModel');
const Wallet = require('../models/WalletModel');
const authenticateFirebaseUser = require('../middleware/authMiddleware');
const router = express.Router();

// Route to handle user login
router.post('/login', async (req, res) => {
    const { uid, email, displayName } = req.body;
    try {
        let user = await User.findOne({ uid });
        if (!user) {
            // If the user does not exist, create a new user
            user = await User.create({ uid, email, displayName });
            // Create a wallet for the new user
            await Wallet.create({ userId: uid });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// Route to attach phone number
router.patch('/attach-phone', authenticateFirebaseUser, async (req, res) => {
    const phoneNumber = req.body.phoneNumber;
    try {
        const existingUser = await User.findOne({ phoneNumber });
        if (existingUser) {
            return res.status(409).send('Phone number is already in use');
        }

        const user = await User.findOneAndUpdate(
            { uid: req.user.uid },
            { phoneNumber },
            { new: true }
        );
        if (!user) return res.status(404).send('User not found');
        res.status(200).json({ success: true, user });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// Route to attach ID card UID
router.patch('/attach-id', authenticateFirebaseUser, async (req, res) => {
    const idCardUID  = req.body.idCardUID;
    try {
        const existingUser = await User.findOne({ idCardUID });
        if (existingUser) {
            return res.status(409).send('ID Card is already in use');
        }

        const user = await User.findOneAndUpdate(
            { uid: req.user.uid },
            { idCardUID },
            { new: true }
        );

        if (!user) return res.status(404).send('User not found');

        // Update the wallet with card UID
        const wallet = await Wallet.findOneAndUpdate(
            { userId: req.user.uid },
            { cardUID: idCardUID },
            { new: true }
        );

        if (!wallet) return res.status(404).send('Wallet not found');

        res.status(200).json({ success: true, user, wallet });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

module.exports = router;