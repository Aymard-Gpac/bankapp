/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      // /clients/7/accounts  ->  /student/clients/7/accounts
      {
        source: "/api/clients/:clientId/accounts",
        destination: "/student/clients/:clientId",
      },
      // /client/7/accounts  ->  /student/clients/7/accounts
       {
        source: "/client/:clientId/accounts",
        destination: "/student/clients/:clientId",
      },

      // (optionnel) si tu veux aussi /clients/7 -> /student/clients/7
      {
        source: "/client/:clientId/my-banks",
        destination: "/student/clients/:clientId/my-banks",
      },

      // // (optionnel) si tu veux /clients -> /student/clients
      // {
      //   source: "/clients",
      //   destination: "/student/clients",
      // },
    ];
  },
};
export default nextConfig;
