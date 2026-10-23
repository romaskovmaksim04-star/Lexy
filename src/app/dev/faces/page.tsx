import { notFound } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { FaceGrid } from "./FaceGrid";

// Every mood of Lexi's face side by side, for design work: in development, or for the
// owners' accounts (Pro+) on the live site.
export default async function Faces() {
  if (process.env.NODE_ENV === "production") {
    const user = await currentUser();
    if (user?.plan !== "proplus") notFound();
  }
  return <FaceGrid />;
}
