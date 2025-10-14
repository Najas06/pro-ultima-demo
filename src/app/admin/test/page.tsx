"use client"

import { createClient } from '@/lib/supabase/client'
import React, { useEffect } from 'react'

export default function page() {
    
  useEffect(() => {
    let channel: any;
    const supabase = createClient();
    
    channel = supabase.channel('room:123:messages')
    
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    }
  }, [])
  
  return (
    <div>page</div>
  )
}

