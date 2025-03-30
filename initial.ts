import { auth } from "@/lib/auth";
import { db, user } from "@nexirift/db";
import { eq } from "drizzle-orm";

(async () => {
  const DEV_EMAIL = "developer@nexirift.com";

  try {
    const signUp = await auth.api.signUpEmail({
      asResponse: true,
      body: {
        email: DEV_EMAIL,
        name: "Developer User",
        username: "developer",
        password: "P@ssw0rd",
        birthday: new Date("1999-01-01"),
      },
    });

    await db
      .update(user)
      .set({ emailVerified: true })
      .where(eq(user.email, DEV_EMAIL))
      .execute();

    console.log(`Successfully created and verified user: ${DEV_EMAIL}`);
    await db.$client.end();
    return signUp;
  } catch (error) {
    console.error(
      "Failed to create user:",
      error instanceof Error ? error.message : error,
    );
    await db.$client.end();
    throw error;
  }
})();
