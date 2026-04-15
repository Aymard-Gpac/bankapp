import NextLink from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { User } from "@/types";
import { Button } from "./ui/button";

export type Client = User & { role: "client" | "student" | "admin" };

export default function ClientsTable({ clients }: { clients: Client[] }) {
  return (
    <Table>
      <TableHeader className="bg-[#f9fafb]">
        <TableRow>
          <TableHead className="px-2">Nom</TableHead>
          <TableHead className="px-2">Email</TableHead>
          <TableHead className="px-2">Ville</TableHead>
          <TableHead className="px-2">Province</TableHead>
          <TableHead className="px-2">Code postal</TableHead>
          <TableHead className="px-2 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {(clients || []).map((c) => {
          const clientId = c.userId ?? (c as any).id ?? c.id;

          return (
            <TableRow
              key={clientId}
              className="hover:bg-gray-50 border-b"
            >
              <TableCell className="pl-2 pr-10 font-semibold text-[#344054]">
                {c.firstName} {c.lastName}
              </TableCell>

              <TableCell className="pl-2 pr-10">{c.email}</TableCell>
              <TableCell className="pl-2 pr-10">{c.city}</TableCell>
              <TableCell className="pl-2 pr-10">{c.state}</TableCell>
              <TableCell className="pl-2 pr-10">{c.postalCode}</TableCell>

              <TableCell className="pl-2 pr-2 text-right">
                <NextLink href={`/student/clients/${clientId}`}>
                  <Button variant="outline" size="sm">
                    Détails comptes
                  </Button>
                </NextLink>
              </TableCell>
            </TableRow>
          );
        })}

        {(!clients || clients.length === 0) && (
          <TableRow>
            <TableCell colSpan={6} className="p-6 text-center text-gray-500">
              Aucun client trouvé.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
