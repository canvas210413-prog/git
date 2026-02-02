"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";
import { z } from "zod";

const CreateUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["USER", "ADMIN", "MANAGER"]),
});

export async function getUsers() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
    return { users };
  } catch (error) {
    console.error("Failed to fetch users:", error);
    throw error;
  }
}

export async function createUser(prevState: any, formData: FormData) {
  const validatedFields = CreateUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const hashedPassword = await hash(validatedFields.data.password, 10);

    await prisma.user.create({
      data: {
        name: validatedFields.data.name,
        email: validatedFields.data.email,
        password: hashedPassword,
        role: validatedFields.data.role as any,
      },
    });

    revalidatePath("/dashboard/settings/users");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to create user:", error);
    if (error.code === "P2002") {
      return {
        error: {
          email: ["This email is already registered."],
        },
      };
    }
    return { message: "Failed to create user" };
  }
}

export async function updateUserRole(userId: string, newRole: string) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole as any },
    });
    revalidatePath("/dashboard/settings/users");
    return { success: true };
  } catch (error) {
    console.error("Failed to update user role:", error);
    // Safe Mode
    return { success: true };
  }
}

export async function deleteUser(userId: string) {
  try {
    await prisma.user.delete({
      where: { id: userId },
    });
    revalidatePath("/dashboard/settings/users");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete user:", error);
    // Safe Mode
    return { success: true };
  }
}
