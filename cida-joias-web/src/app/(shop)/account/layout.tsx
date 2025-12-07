import { AccountSidebar } from '@/components/account/AccountSidebar';
import { Card, CardContent } from '@/components/ui/card';

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Minha Conta</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <aside className="md:col-span-1">
          <Card>
            <CardContent className="p-4">
              <AccountSidebar />
            </CardContent>
          </Card>
        </aside>
        
        <div className="md:col-span-3">
          {children}
        </div>
      </div>
    </div>
  );
}