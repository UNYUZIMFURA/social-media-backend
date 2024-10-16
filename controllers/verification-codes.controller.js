const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const { sendCodeToEmail } = require("../services/email.service");

const verifyCode = async (req, res) => {
  let { userId, code } = req.body;

  if (!code) {
    return res.status(400).json({
      success: false,
      message: "Please provide the code",
    });
  }

  try {
    const originalCode = await prisma.code.findFirst({
      where: {
        userId,
      },
    });
    
    if (!originalCode) {
      return res.status(404).json({
        success: false,
        message: "The user didn't receive the code",
      });
    }

    const user = await prisma.user.findFirst({
      where: {
        id: userId,
      },
    });

    if (originalCode.code === code) {
      // It's the user's first time creating account and the verified is originally set to false
      if (!user.verified) {
        const verifiedUser = await prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            verified: true,
          },
        });

        await prisma.code.delete({
          where: {
            id: originalCode.id,
          },
        });

        const token = jwt.sign(
          { id: verifiedUser.id, email: verifiedUser.email },
          process.env.JWT_SECRET
        );

        return res.status(200).json({
          success: true,
          message: "Email successfully verified",
          verifiedUser,
          token,
        });
      }

      // The user already has an account and is verifying the code again through reset password
      const verifiedUser = await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          // Enabling the user to be able to reset Password
          resetPasswordFlag: true,
        },
      });

      await prisma.code.delete({
        where: {
          id: originalCode.id
        }
      })

      return res.status(200).json({
        success: true,
        message: "Email successfully verified",
        verifiedUser,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Incorrect verification code",
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Error verifying code",
      err,
    });
  }
};

const sendCodeToResetEmail = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }
    await sendCodeToEmail(email, res, user);
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Error sending email",
      err,
    });
  }
};

const deleteVerificationCodes = async (req, res) => {
  try {
    await prisma.code.deleteMany();
    return res.status(204).json({});
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Error deleting verification codes",
      err
    });
  }
};

module.exports = { verifyCode, sendCodeToResetEmail, deleteVerificationCodes };
