"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import CustomInput from "./CustomInput";
import { authFormSchema } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { signIn, signUp } from "@/lib/actions/user.actions";

type AuthFormType = "sign-in" | "sign-up";

const AuthForm = ({ type }: { type: AuthFormType }) => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const formSchema = authFormSchema(type);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (type === "sign-up") {
        const userData = {
          firstName: data.firstName!,
          lastName: data.lastName!,
          address1: data.address1!,
          city: data.city!,
          state: data.state!,
          postalCode: data.postalCode!,
          dateOfBirth: data.dateOfBirth!,
          ssn: data.ssn!,
          email: data.email,
          password: data.password,
        };

        const newUser = await signUp(userData);
        setUser(newUser);

        router.push("/sign-in");
        return;
      }

      const response = await signIn({
        email: data.email,
        password: data.password,
      });

      document.cookie = `token=${response.token}; path=/; max-age=86400`;
      localStorage.setItem("token", response.token);
      const role = response?.user?.role;

      if (role === "client") {
        window.location.href = "/";
      } else if (role === "etudiant") {
        window.location.href = "/student";
      } else {
        setErrorMsg("Rôle introuvable");
      }
    } catch (error: any) {
      console.log(error);
      setErrorMsg(error?.message || "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="auth-form">
      <header className="flex flex-col gap-5 md:gap-8">
        <Link href="/" className="cursor-pointer flex items-center gap-1">
          <Image src="/icons/logo.svg" width={34} height={34} alt="Logo Horizon" />
          <h1 className="text-26 font-ibm-plex-serif font-bold text-black-1">
            BANK APP
          </h1>
        </Link>

        <div className="flex flex-col gap-1 md:gap-3">
          <h1 className="text-24 lg:text-36 font-semibold text-gray-900">
            {user ? "Lier un compte" : type === "sign-in" ? "Connexion" : "Inscription"}
          </h1>
          <p className="text-16 font-normal text-gray-600">
            {user ? "Liez votre compte pour commencer" : "Veuillez entrer vos informations"}
          </p>

          {errorMsg && (
            <p className="text-sm text-red-600 font-medium">{errorMsg}</p>
          )}
        </div>
      </header>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {type === "sign-up" && (
            <>
              <div className="flex gap-4">
                <CustomInput
                  control={form.control}
                  name="firstName"
                  label="Prénom"
                  placeholder="Entrez votre prénom"
                />
                <CustomInput
                  control={form.control}
                  name="lastName"
                  label="Nom"
                  placeholder="Entrez votre nom"
                />
              </div>

              <CustomInput
                control={form.control}
                name="address1"
                label="Adresse"
                placeholder="Entrez votre adresse complète"
              />

              <CustomInput
                control={form.control}
                name="city"
                label="Ville"
                placeholder="Entrez votre ville"
              />

              <div className="flex gap-4">
                <CustomInput
                  control={form.control}
                  name="state"
                  label="Province / État"
                  placeholder="Exemple : ON"
                />
                <CustomInput
                  control={form.control}
                  name="postalCode"
                  label="Code postal"
                  placeholder="Exemple : K1A0B1"
                />
              </div>

              <div className="flex gap-4">
                <CustomInput
                  control={form.control}
                  name="dateOfBirth"
                  label="Date de naissance"
                  placeholder="AAAA-MM-JJ"
                />
                <CustomInput
                  control={form.control}
                  name="ssn"
                  label="NAS / Identifiant"
                  placeholder="Exemple : 1234"
                />
              </div>
            </>
          )}

          <CustomInput
            control={form.control}
            name="email"
            label="Courriel"
            placeholder="Entrez votre courriel"
          />

          <CustomInput
            control={form.control}
            name="password"
            label="Mot de passe"
            placeholder="Entrez votre mot de passe"
          />

          <div className="flex flex-col gap-4">
            <Button type="submit" disabled={isLoading} className="form-btn">
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" /> &nbsp; Chargement...
                </>
              ) : type === "sign-in" ? (
                "Se connecter"
              ) : (
                "S’inscrire"
              )}
            </Button>
          </div>
        </form>
      </Form>

      <footer className="flex justify-center gap-1">
        <p className="text-14 font-normal text-gray-600">
          {type === "sign-in"
            ? "Vous n'avez pas de compte ?"
            : "Vous avez déjà un compte ?"}
        </p>
        <Link
          href={type === "sign-in" ? "/sign-up" : "/sign-in"}
          className="form-link"
        >
          {type === "sign-in" ? "S'inscrire" : "Se connecter"}
        </Link>
      </footer>
    </section>
  );
};

export default AuthForm;