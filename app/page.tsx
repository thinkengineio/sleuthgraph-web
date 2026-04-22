"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconArrowRight, IconLogout } from "@tabler/icons-react";

import { useAuth } from "@/lib/AuthContext";

import classes from "./landing.module.css";

export default function Home() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    notifications.show({
      title: "Signed out",
      message: "You have been logged out.",
      color: "blue",
    });
    router.refresh();
  }

  return (
    <div className={classes.page}>
      <div className={classes.bgAurora} aria-hidden="true" />
      <div className={classes.bgGrid} aria-hidden="true" />
      <div className={classes.bgVignette} aria-hidden="true" />

      <div className={classes.content}>
        <span
          className={`${classes.chip} ${classes.fadeIn}`}
          style={{ "--delay": "0ms" } as React.CSSProperties}
        >
          <span className={classes.chipDot} />
          Pre-alpha
        </span>

        <h1
          className={`${classes.wordmark} ${classes.fadeIn}`}
          style={{ "--delay": "80ms" } as React.CSSProperties}
        >
          Sleuthgraph
        </h1>

        <p
          className={`${classes.tagline} ${classes.fadeIn}`}
          style={{ "--delay": "160ms" } as React.CSSProperties}
        >
          Open-source <span className={classes.taglineAccent}>OSINT investigation workbench</span>.
          Pivot across domains, people, and organizations — backed by a typed graph, evidence chain
          of custody, and a plugin SDK.
        </p>

        {!loading && !user && (
          <div
            className={`${classes.ctaRow} ${classes.fadeIn}`}
            style={{ "--delay": "260ms" } as React.CSSProperties}
          >
            <Button
              component={Link}
              href="/login"
              size="md"
              radius="md"
              rightSection={<IconArrowRight size={16} />}
            >
              Sign in to start
            </Button>
          </div>
        )}

        {!loading && user && (
          <>
            <p
              className={`${classes.userHint} ${classes.fadeIn}`}
              style={{ "--delay": "220ms" } as React.CSSProperties}
            >
              Welcome back, <span className={classes.userEmail}>{user.email}</span>
            </p>
            <div
              className={`${classes.ctaRow} ${classes.fadeIn}`}
              style={{ "--delay": "300ms" } as React.CSSProperties}
            >
              <Button
                component={Link}
                href="/cases"
                size="md"
                radius="md"
                rightSection={<IconArrowRight size={16} />}
              >
                Go to cases
              </Button>
              <Button
                variant="subtle"
                color="gray"
                size="md"
                radius="md"
                leftSection={<IconLogout size={16} />}
                onClick={handleLogout}
              >
                Sign out
              </Button>
            </div>
          </>
        )}

        <p
          className={`${classes.footer} ${classes.fadeIn}`}
          style={{ "--delay": "380ms" } as React.CSSProperties}
        >
          <a href="https://github.com/francose/sleuthgraph" target="_blank" rel="noopener">
            github.com/francose/sleuthgraph
          </a>
        </p>
      </div>
    </div>
  );
}
