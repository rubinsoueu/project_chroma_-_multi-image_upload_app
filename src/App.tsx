import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { PhotoUpload } from "./components/PhotoUpload";
import { PhotoGrid } from "./components/PhotoGrid";
import { PhotoToolbar } from "./components/PhotoToolbar";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4">
        <h2 className="text-xl font-semibold text-primary">Project Chroma</h2>
        <SignOutButton />
      </header>
      <main className="flex-1 p-8">
        <Content />
      </main>
      <Toaster />
    </div>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold text-primary mb-4">Welcome to Project Chroma</h1>
        <Authenticated>
          <p className="text-xl text-secondary mb-8">
            Upload and manage your photo collection
          </p>
        </Authenticated>
        <Unauthenticated>
          <p className="text-xl text-secondary mb-8">Sign in to get started</p>
        </Unauthenticated>
      </div>

      <Authenticated>
        <div className="space-y-8">
          <PhotoUpload />
          <PhotoToolbar />
          <PhotoGrid />
        </div>
      </Authenticated>

      <Unauthenticated>
        <div className="max-w-md mx-auto">
          <SignInForm />
        </div>
      </Unauthenticated>
    </div>
  );
}
