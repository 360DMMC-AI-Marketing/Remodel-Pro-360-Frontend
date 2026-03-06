export interface UserResponse {
    message: string,
    user: {
        id: string,
        email: string,
        firstName: string,
        lastName: string,
        role: string
    },
    tokens: {
        accessToken: string,
        refreshToken: string,
        expiresIn: string
    }
}