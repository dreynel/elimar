 'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { User, Mail, Calendar, Search, Loader2, AlertCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { API_URL } from '@/lib/utils';

interface ClientData {
  id: number;
  name: string;
  email: string;
  contactNumber?: string;
  memberSince: string;
  totalBookings: number;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [filteredClients, setFilteredClients] = useState<ClientData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredClients(clients);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredClients(
        clients.filter(client =>
          client.name.toLowerCase().includes(query) ||
          client.email.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, clients]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch(`${API_URL}/api/auth/clients`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        const clientsData = data.data.map((client: any) => ({
          id: client.id,
          name: client.name,
          email: client.email,
          contactNumber: client.contactNumber,
          memberSince: new Date(client.memberSince).toLocaleDateString('en-US', { 
            month: 'short', 
            year: 'numeric' 
          }),
          totalBookings: client.totalBookings,
        }));
        
        setClients(clientsData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <p className="text-lg text-muted-foreground">{error}</p>
        <Button onClick={fetchClients}>Try Again</Button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-1">Clients</h2>
        <p className="text-sm text-muted-foreground">Manage your client database and member information</p>
      </div>
      
      <Card className="shadow-lg border-2">
        <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-primary/10">
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Client List
          </CardTitle>
          <CardDescription className="mt-1">
            {clients.length} registered clients with active bookings
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input 
                placeholder="Search clients by name or email..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Member Since</TableHead>
                <TableHead>Total Bookings</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <TableRow key={client.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{client.name}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            {client.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          {client.email}
                        </div>
                        {client.contactNumber && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            {client.contactNumber}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {client.memberSince}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {client.totalBookings} booking{client.totalBookings !== 1 ? 's' : ''}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-12">
                    <div className="flex flex-col items-center gap-2">
                      <User className="w-12 h-12 text-muted-foreground/50" />
                      {searchQuery ? (
                        <>
                          <p>No clients found matching "{searchQuery}"</p>
                          <p className="text-sm">Try a different search term</p>
                        </>
                      ) : (
                        <>
                          <p>No clients to display yet.</p>
                          <p className="text-sm">Clients will appear here after making bookings.</p>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
