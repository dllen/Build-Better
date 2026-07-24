import { Link } from "react-router-dom";


// Center (0,0).
// Center 0,0.


  { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
  { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
];

interface Point {
  q: number;
  r: number;
}

interface Piece {
  id: number;
  q: number;
  r: number;
}

  for (let q = -8; q <= 8; q++) {
    for (let r = -8; r <= 8; r++) {
      // Condition for Star:
      
      // Top (Red): r <= -5 (and within cone)
      // Bottom (Green): r >= 5
      // etc.
      
      
      }
    }
  }
};

  
  // Bottom (Player Home): q in [-4, 4], r in [5, 8]
  // Top-Right: q in [5, 8], r in [-8, -5] ... NO.
  
  // Correct Logic for Star:
  
  
  
  
  
  
  // Top Tip: (0, -8, 8).
  
  // Bottom Tip: (0, 8, -8).
  
  
  
  
  return inA || inB;
};

  let id = 0;
  
  // Player (Bottom)
  // Zone: r > 4
  for (let q = -8; q <= 8; q++) {
    for (let r = 5; r <= 8; r++) {
       }
    }
  }
  
  // AI (Top)
  // Zone: r < -4
  for (let q = -8; q <= 8; q++) {
    for (let r = -8; r <= -5; r++) {
       }
    }
  }
  
};



// 1. Step to adjacent empty.
  
  
  
  // Add Adjacent Empty
  DIRECTIONS.forEach(d => {
    }
  });

  
  while (jumpQueue.length > 0) {
    
    DIRECTIONS.forEach(d => {
      
        
          // Valid jump
            }
          }
        }
      }
    });
  }
  
  // Unique
};

// AI Logic
// Player Target: Top (r=-8). AI Target: Bottom (r=8).
// Score = Sum (targetRow - p.r) ? No.
// Player Score = Sum(-p.r). (Since they want to go to -8).

  
    // Target q=0, r=targetR.
  });
  
};

// Check Win Condition
  
  // AI Target Zone: Bottom Triangle (r >= 5)
  // Player Target Zone: Top Triangle (r <= -5)
    ? (p: Piece) => p.r >= 5
    : (p: Piece) => p.r <= -5;
    
};



  // Handle Selection
    if (winner || turn !== "player" || !gameStarted) return;

    // Check if clicked on a piece
    
    if (clickedPiece && clickedPiece.owner === "player") {
      // Select Piece
      // Check if clicked on a valid move
      if (move) {
        // Execute Move
      }
    }
  };

    
    // Check Win
    
    }
  };

  // AI Turn
    if (gameStarted && turn === "ai" && !winner) {
        makeAiMove();
      return () => clearTimeout(timer);
    }
  }, [turn, gameStarted, winner]);


        // Evaluate Move
        
        
        
        

        // Difficulty Tuning
           // Hard:
           
           
           
        }

      });
    });

    // Sort and Pick
    
      // Pick top 1 or random from top few
    }
  };

  };

  // Hex to Pixel

  };

  return (
            </button>
          </Link>
          </h1>
        </div>

          {/* Game Board */}
                
                let fill = "#e2e8f0"; // Default
                if (pt.r <= -5) fill = "#fee2e2"; // Top (AI Home) - Light Red
                if (pt.r >= 5) fill = "#dcfce7"; // Bottom (Player Home) - Light Green
                
                return (
                  <g key={`${pt.q},${pt.r}`} onClick={() => handlePointClick(pt.q, pt.r)}>
                    <circle 
                      cx={x} cy={y} r="2" 
                      fill={fill}
                    />
                      <circle 
                        cx={x} cy={y} r="3.5" 
                      />
                    )}
                  </g>
                );
              })}

                
                return (
                  <circle
                    key={p.id}
                    cx={x} cy={y} r="2.8"
                    fill={color}
                    }`}
                    onClick={(e) => {
                      handlePointClick(p.q, p.r);
                    }}
                    }}
                  />
                );
              })}

            {!gameStarted && !winner && (
                      <button
                        key={d}
                          difficulty === d 
                            ? "bg-emerald-600 text-white" 
                            : "bg-gray-200 dark:bg-gray-700"
                        }`}
                      >
                      </button>
                    ))}
                  </div>
                  <button 
                  >
                  </button>
                </div>
              </div>
            )}

            {winner && (
                   </h2>
                   <button 
                   >
                   </button>
                 </div>
               </div>
            )}
          </div>

                <button 
                >
                </button>
              </div>
              
                  </div>
                </div>
              </div>

              </div>
            </div>
            
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

