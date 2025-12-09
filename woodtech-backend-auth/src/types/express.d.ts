import type { UserProfile } from "../modules/user/user.types";

declare module "express-serve-static-core" {
  interface Request {
    user?: UserProfile;
  }
}
