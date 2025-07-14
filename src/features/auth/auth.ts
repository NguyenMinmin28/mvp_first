import { NextAuthOptions } from "next-auth";

import authConfig from "../../../config/auth.config";

export const authOptions: NextAuthOptions = {
  ...authConfig,
};
