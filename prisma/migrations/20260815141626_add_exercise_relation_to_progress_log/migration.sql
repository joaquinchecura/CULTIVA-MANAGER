-- AddForeignKey
ALTER TABLE "progress_logs" ADD CONSTRAINT "progress_logs_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;
