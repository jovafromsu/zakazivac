// Test za styling komponenti - ovo je privremeno za testiranje
'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui'
import { Button } from '@/components/ui/button'

export default function TestStylingPage() {
  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Test styling komponenti</h1>
      
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Select komponenta</h2>
        <Select>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Izaberi opciju" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="opcija1">Opcija 1</SelectItem>
            <SelectItem value="opcija2">Opcija 2</SelectItem>
            <SelectItem value="opcija3">Opcija 3</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">DropdownMenu komponenta</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Otvori meni</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Akcija 1</DropdownMenuItem>
            <DropdownMenuItem>Akcija 2</DropdownMenuItem>
            <DropdownMenuItem>Akcija 3</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}