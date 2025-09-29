import { ChartArea, Computer, Inbox, ListCheckIcon } from "lucide-react";
import { SidebarProvider } from "./components/ui/sidebar.js";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useState } from "react";
import QueuesTab from "./queues/QueuesTab.js";
import JudgesPage from "./judges/JudgesPage.js";
import EvaluationsPage from "./evaluations/EvaluationsPage.js";
import StatisticsPage from "./statistics/StatisticsPage.js";

const menuItems = [
  {
    title: "Queue",
    url: "#",
    icon: Inbox,
  },
  {
    title: "Judges",
    url: "#",
    icon: Computer,
  },
  {
    title: "Evaluations",
    url: "#",
    icon: ListCheckIcon,
  },
  {
    title: "Statistics",
    url: "#",
    icon: ChartArea,
  },
];

enum Tab {
  Queues,
  Judges,
  Evaluations,
  Statistics,
}

export default function App() {
  const [selectedTab, setSelectedTab] = useState<Tab>(Tab.Queues);

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent className="bg-orange-100">
          <SidebarGroup>
            <SidebarGroupLabel>AI Judges</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item, i) => (
                  <SidebarMenuItem
                    key={item.title}
                    onClick={() => setSelectedTab(i)}
                  >
                    <SidebarMenuButton asChild>
                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <main className="w-full h-full overflow-hidden p-4">
        {selectedTab == Tab.Queues ? (
          <QueuesTab />
        ) : selectedTab == Tab.Judges ? (
          <JudgesPage />
        ) : selectedTab == Tab.Evaluations ? (
          <EvaluationsPage />
        ) : (
          <StatisticsPage />
        )}
      </main>
    </SidebarProvider>
  );
}
