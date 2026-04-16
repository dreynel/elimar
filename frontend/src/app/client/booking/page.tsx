"use client"

import React from 'react'
import { redirect } from 'next/navigation'

export default function BookingPage() {
  // This page redirects to accommodations
  // Actual booking happens through the BookingModal component
  redirect('/client/accommodations')
  
  return null
}
