import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserRepository } from "../repositories/user.repository";
import prisma from "../config/prisma";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";

const userRepository = new UserRepository();

const generateTokens = (userId: string, email: string) => {
  const accessToken = jwt.sign({ id: userId, email }, env.JWT_SECRET, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign({ id: userId, email }, env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });

  return { accessToken, refreshToken };
};

export class AuthService {
  async register(data: any) {
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new AppError(400, "Email already exists");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await userRepository.create({
      ...data,
      password: hashedPassword,
    });

    const tokens = generateTokens(user.id, user.email);

    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, ...tokens };
  }

  async login(data: any) {
    const user = await userRepository.findByEmail(data.email);
    if (!user) {
      throw new AppError(401, "Invalid email or password");
    }

    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) {
      throw new AppError(401, "Invalid email or password");
    }

    const tokens = generateTokens(user.id, user.email);

    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, ...tokens };
  }

  async refresh(token: string) {
    const savedToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!savedToken || savedToken.expiresAt < new Date()) {
      if (savedToken) {
        await prisma.refreshToken.delete({ where: { id: savedToken.id } });
      }
      throw new AppError(401, "Invalid or expired refresh token");
    }

    try {
      jwt.verify(token, env.JWT_REFRESH_SECRET);
      
      const tokens = generateTokens(savedToken.userId, savedToken.user.email);

      // Rotate token
      await prisma.refreshToken.update({
        where: { id: savedToken.id },
        data: {
          token: tokens.refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      return tokens;
    } catch (error) {
      await prisma.refreshToken.delete({ where: { id: savedToken.id } });
      throw new AppError(401, "Invalid refresh token");
    }
  }

  async logout(token: string) {
    await prisma.refreshToken.deleteMany({
      where: { token },
    });
  }
}
