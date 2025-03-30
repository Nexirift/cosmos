import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function Page() {
  const greeting = () => {
    const myDate = new Date();
    const hrs = myDate.getHours();

    let greet;

    if (hrs < 12) greet = "Good Morning";
    else if (hrs >= 12 && hrs <= 17) greet = "Good Afternoon";
    else if (hrs >= 17 && hrs <= 24) greet = "Good Evening";

    return greet;
  };

  const data = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <main className="m-4 flex flex-col gap-2">
      <h2 className="text-2xl font-bold">
        {`${greeting()}, ${data?.user.name}!`}
      </h2>
    </main>
  );
}
