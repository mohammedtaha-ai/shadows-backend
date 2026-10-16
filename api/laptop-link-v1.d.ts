/* Generated from src/transports/laptop-link/schema.ts. Do not edit. */

export type LaptopLinkV1 = ClientFrame | ServerFrame;
export type ClientFrame =
  | {
      type: 'hello';
      protocolVersion: 1;
      producerId: string;
      /**
       * Exact safe-integer position in one ordered stream; gapless and never reused.
       */
      lastAck: number;
    }
  | {
      type: 'batch';
      /**
       * @minItems 1
       * @maxItems 20
       */
      entries:
        | [
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            }
          ]
        | [
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            }
          ]
        | [
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            }
          ]
        | [
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            }
          ]
        | [
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            }
          ]
        | [
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            }
          ]
        | [
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            }
          ]
        | [
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            }
          ]
        | [
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            }
          ]
        | [
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            }
          ]
        | [
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            }
          ]
        | [
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            }
          ]
        | [
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            }
          ]
        | [
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            }
          ]
        | [
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            }
          ]
        | [
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            }
          ]
        | [
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            }
          ]
        | [
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            }
          ]
        | [
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            }
          ]
        | [
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            },
            {
              seq: number;
              event:
                | {
                    type: 'session';
                    localSessionId: string;
                    agent: 'claude_code' | 'codex';
                    projectName: string;
                    cwd: string;
                    state: 'running' | 'waiting' | 'ended' | 'offline';
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                  }
                | {
                    type: 'step';
                    localSessionId: string;
                    localStepId: string;
                    /**
                     * UTC, RFC 3339.
                     */
                    at: string;
                    tool: string;
                    path: string | null;
                  };
            }
          ];
    };
export type ServerFrame =
  | {
      type: 'ready';
      epoch: number;
      /**
       * Exact safe-integer position in one ordered stream; gapless and never reused.
       */
      ackThrough: number;
      /**
       * @maxItems 20
       */
      dropped:
        | []
        | [
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            }
          ]
        | [
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            }
          ]
        | [
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            }
          ]
        | [
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            }
          ]
        | [
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            }
          ]
        | [
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            }
          ]
        | [
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            }
          ]
        | [
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            }
          ]
        | [
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            }
          ]
        | [
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            }
          ]
        | [
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            }
          ]
        | [
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            }
          ]
        | [
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            }
          ]
        | [
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            }
          ]
        | [
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            }
          ]
        | [
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            }
          ]
        | [
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            }
          ]
        | [
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            }
          ]
        | [
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            }
          ]
        | [
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            }
          ];
    }
  | {
      type: 'ack';
      epoch: number;
      /**
       * Exact safe-integer position in one ordered stream; gapless and never reused.
       */
      ackThrough: number;
      /**
       * @maxItems 20
       */
      dropped:
        | []
        | [
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            }
          ]
        | [
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            }
          ]
        | [
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            }
          ]
        | [
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            }
          ]
        | [
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            }
          ]
        | [
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            }
          ]
        | [
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            }
          ]
        | [
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            }
          ]
        | [
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            }
          ]
        | [
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            }
          ]
        | [
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            }
          ]
        | [
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            }
          ]
        | [
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            }
          ]
        | [
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            }
          ]
        | [
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            }
          ]
        | [
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            }
          ]
        | [
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            }
          ]
        | [
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            }
          ]
        | [
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            }
          ]
        | [
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            },
            {
              /**
               * Exact safe-integer position in one ordered stream; gapless and never reused.
               */
              seq: number;
              code: 'event_expired';
            }
          ];
    }
  | {
      type: 'refusal';
      code:
        | 'request_invalid'
        | 'unauthorized'
        | 'not_found'
        | 'rate_limited'
        | 'operation_failed'
        | 'link_code_invalid'
        | 'command_conflict'
        | 'resnapshot_required'
        | 'approval_already_decided'
        | 'approval_expired';
    };
