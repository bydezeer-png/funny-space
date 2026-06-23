import { getWorkshops, getEvents } from "@/actions/events"
import EventsManager from "./EventsManager"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { checkUserPermission, PERMISSIONS } from "@/lib/permissions"
import AccessDenied from "@/components/AccessDenied"

export default async function EventsPage() {
  const session = await auth()
  const currentUser = await prisma.user.findUnique({
    where: { id: session?.user?.id }
  })

  if (!checkUserPermission(currentUser, [PERMISSIONS.MANAGE_WORKSHOPS, PERMISSIONS.MANAGE_EVENTS])) {
    return <AccessDenied message="هذه الصفحة مخصصة للموظفات اللواتي يملكن صلاحية إدارة الورش الفنية أو الحفلات والفعاليات." />
  }

  const workshops = await getWorkshops()
  const events = await getEvents()

  const canManageWorkshops = checkUserPermission(currentUser, PERMISSIONS.MANAGE_WORKSHOPS)
  const canManageEvents = checkUserPermission(currentUser, PERMISSIONS.MANAGE_EVENTS)
  
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-foreground mb-2 tracking-tight">إدارة الورش والحفلات</h2>
          <p className="text-foreground/70 font-medium">نظم الورش المحددة بأيام معينة والحفلات ذات اليوم الواحد.</p>
        </div>
      </div>
      
      <EventsManager 
        initialWorkshops={workshops} 
        initialEvents={events} 
        canManageWorkshops={canManageWorkshops} 
        canManageEvents={canManageEvents} 
      />
    </div>
  )
}
