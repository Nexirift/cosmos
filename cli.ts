import { auth } from "@/lib/auth";
import { input, password, select } from "@inquirer/prompts";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

const action = await select({
  message: "Which action do you want to perform?",
  choices: [
    {
      name: "Create",
      value: "create",
    },
  ],
});

if (action === "create") {
  const type = await select({
    message: "Which type do you want to create?",
    choices: [
      {
        name: "User",
        value: "user",
      },
      {
        name: "OAuth2 Application",
        value: "oauth2",
      },
    ],
  });
  if (type === "user") {
    const username = await input({
      message: "Enter your username:",
      validate: (value) => {
        if (!/^[a-zA-Z0-9_]+$/.test(value)) {
          return "Username must only contain letters, numbers, and underscores";
        }
        return true;
      },
    });

    const name = await input({
      message: "Enter your name:",
    });

    const email = await input({
      message: "Enter your email:",
      validate: (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return "Please enter a valid email address";
        }
        return true;
      },
    });

    const pass = await password({
      message: "Enter your password:",
    });

    const birthday = await input({
      message: "Enter your birthday (YYYY-MM-DD):",
      validate: (value) => {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return "Please enter a valid date in YYYY-MM-DD format";
        }
        if (date > new Date()) {
          return "Birthday cannot be in the future";
        }
        const thirteenYearsAgo = new Date();
        thirteenYearsAgo.setFullYear(thirteenYearsAgo.getFullYear() - 13);
        if (date > thirteenYearsAgo) {
          return "You must be at least 13 years old to register";
        }
        return true;
      },
    });

    const spinnerOpts = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
    let i = 0;
    const spinner = setInterval(() => {
      process.stdout.write("\n\r" + spinnerOpts[i] + " Creating user...\n");
      i = (i + 1) % spinnerOpts.length;
    }, 80);

    try {
      await createUser(username, name, email, pass, new Date(birthday));
    } finally {
      clearInterval(spinner);
      process.stdout.write("\r");
    }
  } else if (type === "oauth2") {
    const name = await input({
      message: "Enter application name:",
      validate: (value) => {
        if (!value.trim()) {
          return "Application name cannot be empty";
        }
        return true;
      },
    });

    const redirectUris = [];
    let addMore = true;
    while (addMore) {
      const uri = await input({
        message: "Enter redirect URI:",
        validate: (value) => {
          try {
            new URL(value);
            return true;
          } catch {
            return "Please enter a valid URL";
          }
        },
      });
      redirectUris.push(uri);

      const more = await select({
        message: "Add another redirect URI?",
        choices: [
          { name: "Yes", value: true },
          { name: "No", value: false },
        ],
      });
      addMore = more;
    }

    const spinnerOpts = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
    let i = 0;
    const spinner = setInterval(() => {
      process.stdout.write(
        "\n\r" + spinnerOpts[i] + " Creating OAuth2 application...\n",
      );
      i = (i + 1) % spinnerOpts.length;
    }, 80);

    try {
      await createOAuth2App(name, redirectUris);
    } finally {
      clearInterval(spinner);
      process.stdout.write("\r");
    }
  }
}

async function createUser(
  username: string,
  name: string,
  email: string,
  password: string,
  birthday: Date,
) {
  try {
    const signUp = await auth.api.signUpEmail({
      asResponse: true,
      body: {
        email,
        name,
        username,
        password,
        birthday,
      },
    });

    await db
      .update(user)
      .set({ emailVerified: true })
      .where(eq(user.email, email))
      .execute();

    console.log(`Successfully created and verified user: ${email}`);
    return signUp;
  } catch (error) {
    console.error(
      "Failed to create user:",
      error instanceof Error ? error.message : error,
    );
    throw error;
  } finally {
    await db.$client.end();
  }
}

async function createOAuth2App(name: string, redirectUris: string[]) {
  try {
    const app = await auth.api.registerOAuthApplication({
      asResponse: true,
      body: {
        client_name: name,
        redirect_uris: redirectUris,
      },
    });

    console.log(`Successfully created OAuth2 application: ${name}`);
    return app;
  } catch (error) {
    console.error(
      "Failed to create OAuth2 application:",
      error instanceof Error ? error.message : error,
    );
    throw error;
  } finally {
    await db.$client.end();
  }
}
