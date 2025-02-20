"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { InferSelectModel } from "drizzle-orm";
import { useState } from "react";

export function Invite({ data }: { data: any }) {
  // replace when added
  const [declined, setDeclined] = useState(false);

  return (
    <Card className="max-w-md shadow-lg hover:shadow-xl transition-shadow duration-300 relative">
      {declined && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center text-white text-xl font-semibold rounded-xl z-10">
          You declined the invitation.
        </div>
      )}
      <CardHeader className="space-y-4">
        <CardTitle className="text-2xl font-bold text-center">
          You have been invited!
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          <Avatar className="w-6 h-6 ring-2 ring-gray-600">
            <AvatarImage src="https://github.com/Creaous.png" />
            <AvatarFallback>CR</AvatarFallback>
          </Avatar>
          Mitchell has invited you to join Nexirift.
        </CardDescription>
        <CardContent className="flex gap-3 justify-center items-center w-full p-0">
          <Button className="w-full success group bg-green-600 hover:bg-green-700 text-neutral-50 font-medium transition-colors duration-200">
            Accept
          </Button>
          <Button
            variant="destructive"
            className="w-full font-medium hover:bg-red-700 transition-colors duration-200"
            onClick={() => setDeclined(true)}
          >
            Decline
          </Button>
        </CardContent>
        <CardFooter className="p-0">
          <Label className="text-gray-500 text-sm">
            Nexirift is currently in a private alpha phase.
          </Label>
        </CardFooter>
      </CardHeader>
    </Card>
  );
}
