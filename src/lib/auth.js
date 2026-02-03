import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secretKey = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? null : 'ottobite-dev-secret')
if (!secretKey) {
    throw new Error('JWT_SECRET is required')
}
const key = new TextEncoder().encode(secretKey)

export async function encrypt(payload) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(key);
}

export async function decrypt(input) {
    try {
        const { payload } = await jwtVerify(input, key, {
            algorithms: ['HS256'],
        });
        return payload;
    } catch (error) {
        return null;
    }
}

export async function getSession() {
    const session = cookies().get('session')?.value;
    if (!session) return null;
    return await decrypt(session);
}
