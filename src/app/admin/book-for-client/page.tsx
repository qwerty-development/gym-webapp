import React, { useState, useEffect } from 'react';
import AdminNavbarComponent from '@/app/components/admin/adminnavbar';
import { checkRoleAdmin } from '../../../../utils/roles';
import { redirect } from 'next/navigation';
import BookForClient from '@/app/components/admin/bookforclient';

export default function bookforclient() {
  if (!checkRoleAdmin("admin")) {
    redirect("/");
  }
  return(
    <div>
      <AdminNavbarComponent/>
      <section className="container mt-5 mx-auto px-4 sm:px-6 lg:px-8">
        <BookForClient/>
      </section>

    </div>

  )

}