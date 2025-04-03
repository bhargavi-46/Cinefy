import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
  
const addUser = async (user) => {
  try {
    const response = await fetch("http://localhost:3000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: user.name,
        email: user.email,
      }),
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || "Something went wrong");
    }
  } catch (error) {
    console.error("Error Adding User:", error.message);
  }
};

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async session({ session }) {
      if (session?.user) {
        await addUser(session.user);
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      return `${baseUrl}/home`; 
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
