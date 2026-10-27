-- AlterTable
ALTER TABLE "gym_config" ADD COLUMN     "dashboardQuickActions" TEXT[] DEFAULT ARRAY['clientes', 'rutinas', 'agenda', 'pagos']::TEXT[];
