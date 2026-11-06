<?php

namespace App\Policies;

use App\Models\User;

class ReportPolicy
{
    /**
     * Determine whether the user can view reports and operational analytics.
     */
    public function view(User $user): bool
    {
        return $user->hasPermission('reports.view');
    }

    /**
     * Determine whether the user can export reports to CSV or PDF.
     */
    public function export(User $user): bool
    {
        return $user->hasPermission('reports.export');
    }
}

