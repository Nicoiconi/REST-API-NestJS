import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuthDto } from "./dto";
import * as argon from "argon2"
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

@Injectable({})
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService
  ) { }

  async signup(dto: AuthDto) {

    const hash = await argon.hash(dto.password)

    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          hash
        },
        // select:{ // only return these fields
        //   id: true,
        //   email: true,
        //   createdAt: true
        // }
      })
      // delete user.hash // remove hash prop before return user

      return this.signToken(user.id, user.email)

    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          throw new ForbiddenException("Credentials taken")
        }
      }
      throw error
    }
  }

  async signin(dto: AuthDto) {

    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: dto.email
      }
    })

    if (!existingUser) throw new ForbiddenException("Credentials are incorrect")

    const passMatches = await argon.verify(existingUser.hash, dto.password)

    if (!passMatches) throw new ForbiddenException("Credentials are incorrect")

    return this.signToken(existingUser.id, existingUser.email)
  }

  async signToken(userId: number, email: string): Promise<{ access_token: string }> {
    const payload = {
      sub: userId,
      email
    }

    const secret = this.config.get("JWT_SECRET")

    const token = await this.jwt.signAsync(payload, {
      expiresIn: "15m",
      secret: secret
    })

    return {
      access_token: token
    }
  }
}
