// Infrastructure auth placeholder (JWT service)
export class JWTService {
  sign(payload: any) {
    // TODO: sign token
    return 'token-placeholder';
  }
  verify(token: string) {
    // TODO: verify token
    return { sub: 'user' };
  }
}
