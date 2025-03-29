import { auth } from "@/lib/auth";
import { faker } from "@faker-js/faker";
import { db, invitation, user, userRelationship } from "@nexirift/db";
import { eq, isNull } from "drizzle-orm";
import { generateInviteCode } from "plugins/invitation-plugin";

const password = "P@ssw0rd";

/**
 * Fetches the first user to use as a creator for invitations
 */
const firstUser = await db.query.user.findFirst({
  orderBy: (_user, { asc }) => asc(user.createdAt),
});

/**
 * Creates a single user with randomly generated information
 * @returns The sign up response or undefined if error occurred
 */
async function createUser() {
  if (!firstUser) {
    console.error("No initial user found");
    return;
  }

  const email = faker.internet.email();
  const name = faker.internet.displayName();
  const username = faker.internet.username().replace(/[.-]/g, "").slice(0, 30);
  const birthday = faker.date.birthdate();
  const invite = generateInviteCode();

  try {
    // Create invitation
    await db
      .insert(invitation)
      .values({
        id: faker.string.uuid(),
        code: invite,
        creatorId: firstUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .execute();

    // Sign up user
    const signUp = await auth.api.signUpEmail({
      asResponse: true,
      body: {
        email,
        name,
        username,
        password,
        birthday,
        invitation: invite,
      },
      headers: {},
    });

    const userInDb = await db.query.user.findFirst({
      where: eq(user.email, email),
    });

    if (!userInDb) {
      console.error("Failed to find user in database");
      return;
    }

    // Verify email
    await db
      .update(user)
      .set({ emailVerified: true })
      .where(eq(user.email, email))
      .execute();

    console.log("Created user:", email);

    await createRelationships(userInDb.id);

    return signUp;
  } catch (error) {
    console.error(`Failed to create user ${email}:`, error);
    return;
  }
}

/**
 * Creates relationships between users
 * @param userIds Array of user IDs to create relationships between
 */
async function createRelationships(userId: string) {
  const users = await db.query.user.findMany();

  // Use a copy of userIds array that we can modify
  const userIds = users.map((user) => user.id).filter((id) => id !== userId);
  const availableUserIds = [...userIds]; // Create a copy to modify

  if (userIds.length < 2) {
    console.log("Not enough users to create relationships");
    return;
  }

  console.log("Creating user relationships...");

  const relationshipTypes = ["FOLLOW", "REQUEST", "BLOCK", "MUTE"] as const;
  const relationshipsToCreate = [];
  const mutualPairs = new Set<string>();
  const usedUserIds = new Set<string>();

  // Create at least 25 of each relationship type
  for (const type of relationshipTypes) {
    for (let i = 0; i < 25 && availableUserIds.length >= 2; i++) {
      // Random selection of user IDs
      const fromIndex = Math.floor(Math.random() * availableUserIds.length);
      let toIndex;
      do {
        toIndex = Math.floor(Math.random() * availableUserIds.length);
      } while (toIndex === fromIndex);

      const fromId = availableUserIds[fromIndex]!;
      const toId = availableUserIds[toIndex]!;

      relationshipsToCreate.push({
        fromId,
        toId,
        type,
        reason: Math.random() > 0.7 ? faker.lorem.sentence(3) : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Remove users from available list
      usedUserIds.add(fromId);
      usedUserIds.add(toId);

      // Remove in reverse order to prevent index shifting issues
      if (fromIndex > toIndex) {
        availableUserIds.splice(fromIndex, 1);
        availableUserIds.splice(toIndex, 1);
      } else {
        availableUserIds.splice(toIndex, 1);
        availableUserIds.splice(fromIndex, 1);
      }

      // If we're running out of users, replenish the available list
      if (availableUserIds.length < 2 && userIds.length > 2) {
        availableUserIds.push(
          ...userIds.filter((id) => !availableUserIds.includes(id)),
        );
      }
    }
  }

  // Refresh available user IDs for mutual relationships
  if (availableUserIds.length < 2) {
    availableUserIds.push(
      ...userIds.filter((id) => !availableUserIds.includes(id)),
    );
  }

  // Create at least 25 mutual relationships
  for (let i = 0; i < 25 && availableUserIds.length >= 2; i++) {
    const fromIndex = Math.floor(Math.random() * availableUserIds.length);
    let toIndex;
    do {
      toIndex = Math.floor(Math.random() * availableUserIds.length);
    } while (toIndex === fromIndex);

    const fromId = availableUserIds[fromIndex]!;
    const toId = availableUserIds[toIndex]!;
    const pairKey = `${fromId}-${toId}`;
    const reversePairKey = `${toId}-${fromId}`;

    if (!mutualPairs.has(pairKey) && !mutualPairs.has(reversePairKey)) {
      mutualPairs.add(pairKey);
      mutualPairs.add(reversePairKey);

      // Create mutual FOLLOW relationships
      relationshipsToCreate.push({
        fromId,
        toId,
        type: "FOLLOW" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      relationshipsToCreate.push({
        fromId: toId,
        toId: fromId,
        type: "FOLLOW" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Remove users from available list
      usedUserIds.add(fromId);
      usedUserIds.add(toId);

      // Remove in reverse order to prevent index shifting issues
      if (fromIndex > toIndex) {
        availableUserIds.splice(fromIndex, 1);
        availableUserIds.splice(toIndex, 1);
      } else {
        availableUserIds.splice(toIndex, 1);
        availableUserIds.splice(fromIndex, 1);
      }

      // If we're running out of users, replenish the available list
      if (availableUserIds.length < 2 && userIds.length > 2) {
        availableUserIds.push(
          ...userIds.filter((id) => !availableUserIds.includes(id)),
        );
      }
    }
  }

  // Insert relationships in batches to avoid overwhelming the database
  const batchSize = 100;
  for (let i = 0; i < relationshipsToCreate.length; i += batchSize) {
    const batch = relationshipsToCreate.slice(i, i + batchSize);
    await db.insert(userRelationship).values(batch).execute();
  }

  console.log(`Created ${relationshipsToCreate.length} user relationships`);
}

// Expose the function for use in the main script
export { createRelationships };

/**
 * Creates multiple test users in parallel
 * @param count Number of users to create (default: 100)
 */
async function createUsers(count = 100) {
  console.log(`Starting creation of ${count} users...`);

  // Track progress
  let completed = 0;
  const updateInterval = Math.max(1, Math.floor(count / 20)); // Update every ~5%

  const promises = Array.from({ length: count }, async () => {
    const result = await createUser();

    completed++;
    if (completed % updateInterval === 0 || completed === count) {
      console.log(
        `Progress: ${completed}/${count} (${Math.round((completed / count) * 100)}%)`,
      );
    }

    return result;
  });

  await Promise.all(promises);
  console.log(`Successfully completed creation of ${count} users`);
}

// Parse command line arguments for count
const userCount = (() => {
  const arg = process.argv.find((arg) => arg.startsWith("--count="));
  if (arg) {
    const parts = arg ? arg.split("=") : [];
    const count = parts.length > 1 ? parseInt(parts[1]!) : NaN;
    return isNaN(count) ? 100 : count;
  }
  return 100;
})();

await db
  .delete(invitation)
  .where(isNull(invitation.userId))
  .returning()
  .execute();

await createUsers(userCount);
await db.$client.end();
