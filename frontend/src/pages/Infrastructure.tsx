import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Server, Radio, Lock } from 'lucide-react'
import Assets from '@/pages/Assets'
import NetworkDevices from '@/pages/NetworkDevices'
import Passwords from '@/pages/Passwords'

export function Infrastructure() {
  const [tab, setTab] = useState('servers')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Infrastructure</h1>
        <p className="text-muted-foreground mt-1">
          Manage servers, network devices, and credentials in one place.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="rounded-xl">
          <TabsTrigger value="servers" className="rounded-lg gap-2">
            <Server className="h-4 w-4" />
            Servers & Assets
          </TabsTrigger>
          <TabsTrigger value="network" className="rounded-lg gap-2">
            <Radio className="h-4 w-4" />
            Network
          </TabsTrigger>
          <TabsTrigger value="credentials" className="rounded-lg gap-2">
            <Lock className="h-4 w-4" />
            Credentials
          </TabsTrigger>
        </TabsList>

        <TabsContent value="servers" className="mt-6">
          <Assets />
        </TabsContent>
        <TabsContent value="network" className="mt-6">
          <NetworkDevices />
        </TabsContent>
        <TabsContent value="credentials" className="mt-6">
          <Passwords />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Infrastructure
