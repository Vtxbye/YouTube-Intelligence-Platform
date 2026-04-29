"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/app/auth/firebase";

import {
  CardTitle,
  CardDescription,
  CardHeader,
  CardContent,
  CardFooter,
  Card,
} from "@/app/components/ui/card";

import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";

const styles = {
  container: "w-full max-w-md",
  header: "space-y-1",
  title: "text-3xl font-bold text-gray-900",
  description: "text-gray-600",
  content: "space-y-4",
  fieldGroup: "space-y-2",
  footer: "flex flex-col",
  button: "w-full bg-gray-900 hover:bg-black text-white",
  prompt: "mt-4 text-center text-sm text-gray-600",
  link: "ml-2 text-gray-900 hover:text-black font-medium",
};

export function SigninForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace("/"); 
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit}>
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className={styles.header}>
            <CardTitle className={styles.title}>Sign In</CardTitle>
            <CardDescription className={styles.description}>
              Enter your details to sign in to your account
            </CardDescription>
          </CardHeader>

          <CardContent className={styles.content}>
            {error && (
              <p className="text-red-600 text-sm mb-2">{error}</p>
            )}

            <div className={styles.fieldGroup}>
              <Label className="text-gray-700" htmlFor="email">
                Email
              </Label>
              <Input
                id="identifier"
                name="identifier"
                type="email"
                placeholder="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
              />
            </div>

            <div className={styles.fieldGroup}>
              <Label className="text-gray-700" htmlFor="password">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
              />
            </div>
          </CardContent>

          <CardFooter className={styles.footer}>
            <Button className={styles.button} disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </CardFooter>
        </Card>

        <div className={styles.prompt}>
          Don&apos;t have an account?
          <Link className={styles.link} href="/signup">
            Sign Up
          </Link>
        </div>
      </form>
    </div>
  );
}