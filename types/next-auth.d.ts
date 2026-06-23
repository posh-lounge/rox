import NextAuth from "next-auth";

declare module "next-auth" {
    interface User {
        id: string,
        role: string // Extend User interface to include role
    }
    interface Session {
        user: User & {
            id: string,
            role: string
        }
        token: {
            id: string,
            role: number
        }
    }
}
