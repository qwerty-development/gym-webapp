import React, { useState, useEffect } from 'react';
import AdminNavbarComponent from '@/app/components/admin/adminnavbar';
import { checkRole } from '../../../../utils/roles';
import { redirect } from 'next/navigation';
import AddTimeSlotComponent from '@/app/components/admin/addtimeslots';

export default function addtimeslots() {
  if (!checkRole("admin")) {
    redirect("/");
  }
  return(
    <div>
      <AdminNavbarComponent/>
      <section className="container mt-5 mx-auto px-4 sm:px-6 lg:px-8">
        <AddTimeSlotComponent/>
      </section>

    </div>

  )

}