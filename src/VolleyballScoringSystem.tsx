import { useRef, useState, useEffect } from 'react';
import {
  Input,
  Box,
  Grid,
  Card,
  CardContent,
  Table,
  TableContainer,
  Paper,
  TableHead,
  TableCell,
  Button,
  Typography,
  TableRow,
  TableBody
} from '@mui/material';

const initialPlayers = [
  Array(6).fill(''),
  Array(6).fill('')
];

export default function VolleyballScoringSystem() {
  const [teamNames, setTeamNames] = useState(['Team 1', 'Team 2']);
  const [players, setPlayers] = useState(initialPlayers);
  const [scores, setScores] = useState([0, 0]);
  const [currentSet, setCurrentSet] = useState(1);
  const [timeoutsLeft, setTimeoutsLeft] = useState([2, 2]);
  const [timeoutDuration, setTimeoutDuration] = useState(15);
  const [activeTimeout, setActiveTimeout] = useState<null | { team: number; remaining: number }>(null);
  const [matchStarted, setMatchStarted] = useState(false);

  interface ScoreHistoryEntry {
    team: number;
    score: number;
    time: string;
    set: string;
  }

  const [scoreHistory, setScoreHistory] = useState<ScoreHistoryEntry[]>([]);
  interface RotationHistoryEntry {
    rotation: string[];
    time: string;
    set: string;
  }

  const [rotationHistory, setRotationHistory] = useState<RotationHistoryEntry[][]>([[], []]);
  interface SubstitutionHistoryEntry {
    team: number;
    oldPlayer: string;
    newPlayer: string;
    position: number;
    time: string;
    set: string;
  }

  const [substitutionHistory, setSubstitutionHistory] = useState<SubstitutionHistoryEntry[]>([]);
  interface ServingHistoryEntry {
    team: number;
    player: string;
    time: string;
    set: string;
  }

  const [servingHistory, setServingHistory] = useState<ServingHistoryEntry[]>([]);
  interface ActionHistoryEntry {
    type: string;
    team: number;
    playerIndex?: number;
    oldPlayer?: string;
    previousState?: string[];
  }

  const [actionHistory, setActionHistory] = useState<ActionHistoryEntry[]>([]);
  const [setName, setSetName] = useState(`Set ${currentSet}`);

  // TODO
  const historyEndRef = useRef<HTMLDivElement | null>(null);

  const [timeoutHistory, setTimeoutHistory] = useState<any[]>([]);

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [scoreHistory, rotationHistory, substitutionHistory, servingHistory, timeoutHistory]);

  useEffect(() => {
    if (!activeTimeout) return;

    const interval = setInterval(() => {
      setActiveTimeout((prev) => {
        if (!prev) return null;
        if (prev.remaining <= 1) {
          clearInterval(interval);
          return null;
        }
        return { ...prev, remaining: prev.remaining - 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimeout]);

  const getTimestamp = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const clearSetHistory = () => {
    setTeamNames(['Team 1', 'Team 2']);
    setPlayers(initialPlayers);
    setScores([0, 0]);
    setCurrentSet(1);
    setScoreHistory([]);
    setRotationHistory([[], []]);
    setSubstitutionHistory([]);
    setServingHistory([]);
    setTimeoutsLeft([2, 2]);
    setActionHistory([]);
    setTimeoutHistory([]);
    setMatchStarted(false);
  };

  const updateScore = (teamIndex: number) => {
    const newScores = [...scores];
    newScores[teamIndex]++;
    setScores(newScores);
    setScoreHistory((prev) => [
      ...prev,
      { team: teamIndex, score: newScores[teamIndex], time: getTimestamp(), set: setName },
    ]);

    setActionHistory((prev) => [
      ...prev,
      { type: 'score', team: teamIndex },
    ]);
  };

  const rotatePlayers = (teamIndex: number) => {
    setPlayers((prev) => {
      const updatedTeams = [...prev];
      const team = [...updatedTeams[teamIndex]];

      // Anti-clockwise rotation
      const newTeam = [
        team[1],
        team[2],
        team[3],
        team[4],
        team[5],
        team[0],
      ];

      updatedTeams[teamIndex] = newTeam;

      // Record rotation history
      setRotationHistory((prev) => {
        const updatedHistory = [...prev];
        updatedHistory[teamIndex] = [
          ...updatedHistory[teamIndex],
          { rotation: [...newTeam], time: getTimestamp(), set: setName },
        ];
        return updatedHistory;
      });

      // Record rotation action
      setActionHistory((prev) => [
        ...prev,
        { type: 'rotation', team: teamIndex, previousState: team },
      ]);

      return updatedTeams;
    });
  };

  const substitutePlayer = (teamIndex: number, playerIndex: number, newPlayer: string) => {
    if (!newPlayer) return;
    const oldPlayer = players[teamIndex][playerIndex];
    const updated = [...players];
    updated[teamIndex][playerIndex] = newPlayer;
    setPlayers(updated);

    setSubstitutionHistory((prev) => [
      ...prev,
      { team: teamIndex, oldPlayer, newPlayer, position: playerIndex + 1, time: getTimestamp(), set: setName },
    ]);

    setActionHistory((prev) => [
      ...prev,
      { type: 'substitution', team: teamIndex, playerIndex, oldPlayer },
    ]);
  };

  const addServe = (teamIndex: number, playerName: string) => {
    if (!playerName) return;
    setServingHistory((prev) => [
      ...prev,
      { team: teamIndex, player: playerName, time: getTimestamp(), set: setName },
    ]);

    setServingTeam(teamIndex);

    setActionHistory((prev) => [
      ...prev,
      { type: 'serve', team: teamIndex },
    ]);
  };

  const updateTeamName = (teamIndex: number, newName: string) => {
    const updated = [...teamNames];
    updated[teamIndex] = newName;
    setTeamNames(updated);
  };

  const handleStartMatch = () => {
    if (matchStarted) return;

    const timestamp = getTimestamp();

    const newRotationHistory = [...rotationHistory];

    [0, 1].forEach((team) => {
      const entry: RotationHistoryEntry = {
        rotation: [...players[team]],
        time: timestamp,
        set: setName,
      };
      newRotationHistory[team] = [...newRotationHistory[team], entry];
    });

    setRotationHistory(newRotationHistory);
    setMatchStarted(true);
  };

  const undoLastAction = () => {
    const lastAction = actionHistory[actionHistory.length - 1];
    if (!lastAction) return;

    setActionHistory((prev) => prev.slice(0, prev.length - 1)); // Remove last action

    switch (lastAction.type) {
      case 'score':
        setScores((prev) => {
          const updated = [...prev];
          updated[lastAction.team]--;
          return updated;
        });
        setScoreHistory((prev) => prev.slice(0, prev.length - 1));
        break;

      case 'rotation':
        setPlayers((prev) => {
          const updated = [...prev];
          updated[lastAction.team] = lastAction.previousState || [];
          return updated;
        });
        setRotationHistory((prev) => {
          const updated = [...prev];
          updated[lastAction.team] = updated[lastAction.team].slice(0, updated[lastAction.team].length - 1);
          return updated;
        });
        break;

      case 'substitution':
        setPlayers((prev) => {
          const updated = [...prev];
          if (lastAction.playerIndex !== undefined) {
            updated[lastAction.team][lastAction.playerIndex] = lastAction.oldPlayer;
          }
          return updated;
        });
        setSubstitutionHistory((prev) => prev.slice(0, prev.length - 1));
        break;

      case 'serve':
        setServingHistory((prev) => prev.slice(0, prev.length - 1));
        break;

      case 'timeout':
        setTimeoutsLeft(prev => {
          const copy = [...prev];
          copy[lastAction.team]++;
          return copy;
        });
        setTimeoutHistory(prev => prev.slice(0, -1));
        break;
    }
  };

  const renderCourts = () => (
    <div className="grid grid-cols-5 gap-2 text-center items-center mt-8">
      {/* Team 1 Left */}
      <div className={`${servingTeam === 0 ? 'bg-blue-100' : ''}`}>
        {players[0][4] || 'P5'}
      </div>
      <div className={`${servingTeam === 0 ? 'bg-blue-100' : ''}`}>
        {players[0][3] || 'P4'}
      </div>

      {/* Net */}
      <div className="row-span-6 flex items-center justify-center font-bold border-l-2 border-r-2">
        Net
      </div>

      {/* Team 2 Right */}
      <div className={`${servingTeam === 1 ? 'bg-red-100' : ''}`}>
        {players[1][1] || 'P2'}
      </div>
      <div className={`${servingTeam === 1 ? 'bg-red-100' : ''}`}>
        {players[1][0]} {servingTeam === 1 && players[1][0] && (
          <span className="animate-bounce">✋</span>
        )}
      </div>

      {/* Second Row */}
      <div className={`${servingTeam === 0 ? 'bg-blue-100' : ''}`}>
        {players[0][5] || 'P6'}
      </div>
      <div className={`${servingTeam === 0 ? 'bg-blue-100' : ''}`}>
        {players[0][2] || 'P3'}
      </div>
      <div className="hidden" />
      <div className={`${servingTeam === 1 ? 'bg-red-100' : ''}`}>
        {players[1][2] || 'P3'}
      </div>
      <div className={`${servingTeam === 1 ? 'bg-red-100' : ''}`}>
        {players[1][5] || 'P6'}
      </div>

      {/* Third Row */}
      <div className={`${servingTeam === 0 ? 'bg-blue-100' : ''}`}>
        {players[0][0]} {servingTeam === 0 && players[0][0] && (
          <span className="animate-bounce">✋</span>
        )}
      </div>
      <div className={`${servingTeam === 0 ? 'bg-blue-100' : ''}`}>
        {players[0][1] || 'P2'}
      </div>
      <div className="hidden" />
      <div className={`${servingTeam === 1 ? 'bg-red-100' : ''}`}>
        {players[1][3] || 'P4'}
      </div>
      <div className={`${servingTeam === 1 ? 'bg-red-100' : ''}`}>
        {players[1][4] || 'P5'}
      </div>
    </div>
  );

  const exportMatchToCSV = () => {
    const allEvents: { time: string; category: string; details: string }[] = [];

    // Merge all events
    scoreHistory.forEach(h => {
      allEvents.push({
        time: h.time,
        category: 'Score',
        details: `${h.set}, ${teamNames[h.team]} scored 1 point to ${h.score} points`
      });
    });

    rotationHistory.forEach((rotations, teamIndex) => {
      rotations.forEach(h => {
        allEvents.push({
          time: h.time,
          category: 'Rotation',
          details: `${h.set}, ${teamNames[teamIndex]} rotated to [${h.rotation.join('; ')}]`
        });
      });
    });

    substitutionHistory.forEach(h => {
      allEvents.push({
        time: h.time,
        category: 'Substitution',
        details: `${h.set}, ${teamNames[h.team]}: ${h.oldPlayer} ➔ ${h.newPlayer} Position ${h.position}`
      });
    });

    servingHistory.forEach(h => {
      allEvents.push({
        time: h.time,
        category: 'Serving',
        details: `${h.set}, ${teamNames[h.team]} — ${h.player} served`
      });
    });

    timeoutHistory.forEach(h => {
      allEvents.push({
        time: h.time,
        category: 'Timeout',
        details: `${h.set}, ${teamNames[h.team]} took a timeout for ${timeoutDuration} seconds`
      });
    });

    // Sort all events by time
    allEvents.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    // Build CSV
    const rows = [["Time", "Category", "Set", "Details"]];
    allEvents.forEach(event => {
      rows.push([event.time, event.category, event.details]);
    });

    const csvContent = rows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const clean = (str: string) => str.replace(/\s+/g, '_').replace(/[^\w]/g, '');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${clean(setName)}_${clean(teamNames[0])}_vs_${clean(teamNames[1])}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [servingTeam, setServingTeam] = useState<number | null>(null);

  const useTimeout = (teamIndex: number) => {
    if (timeoutsLeft[teamIndex] > 0) {
      const updatedTimeouts = [...timeoutsLeft];
      updatedTimeouts[teamIndex]--;
      setTimeoutsLeft(updatedTimeouts);
      setTimeoutHistory((prev) => [
        ...prev,
        { team: teamIndex, time: getTimestamp(), set: setName },
      ]);

      setActionHistory((prev) => [
        ...prev,
        { type: 'timeout', team: teamIndex },
      ]);

      setActiveTimeout({ team: teamIndex, remaining: timeoutDuration });
    }
  };

  return (
    <Box
      sx={{
        overflowY: 'auto',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#1976d2', // MUI primary blue
        color: 'white',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1300, // Higher than default MUI modals if needed
      }}
    >
      <Grid>
        {activeTimeout && (
          <Card sx={{}}>
            ⏱️ Timeout — {teamNames[activeTimeout.team]} resuming in <span className="font-mono font-bold text-3xl">{activeTimeout.remaining}</span> seconds
          </Card>
        )}
        <Card sx={{}}>
          <CardContent>
            <div className="flex-1 space-y-6">
              <div className="flex-1 space-y-8">
                <Input
                  className="text-xl font-bold w-64"
                  value={setName}
                  onChange={(e) => setSetName(e.target.value)}
                  placeholder="Set Name"
                />
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium">Timeout Duration (second):</label>
                  <Input
                    type="number"
                    value={timeoutDuration}
                    onChange={(e) => setTimeoutDuration(Number(e.target.value))}
                  />
                </div>
                <Button onClick={handleStartMatch} disabled={matchStarted}>
                  {matchStarted ? 'Match Started' : 'Start Match'}
                </Button>
                <Button onClick={undoLastAction} variant="text">Undo Last Action</Button>
                <Button variant="text" onClick={clearSetHistory}>Clear Set History</Button>
                <Button onClick={exportMatchToCSV}>Export Match Report (CSV)</Button>

                {renderCourts()}

                <div className="grid grid-cols-2 gap-6 mt-10">
                  {[0, 1].map((teamIndex) => (
                    <Card key={teamIndex}>
                      <CardContent className="space-y-4">
                        <Input
                          value={teamNames[teamIndex]}
                          onChange={(e) => updateTeamName(teamIndex, e.target.value)}
                          placeholder={`Team ${teamIndex + 1} Name`}
                        />
                        <div className="text-2xl">Score: {scores[teamIndex]}</div>
                        <div className="text-sm text-gray-600">Timeouts left: {timeoutsLeft[teamIndex]}</div>
                        <Button onClick={() => updateScore(teamIndex)}>Add Point</Button>
                        <Button onClick={() => rotatePlayers(teamIndex)}>Rotate Players</Button>

                        <Button
                          onClick={() => useTimeout(teamIndex)}
                          disabled={timeoutsLeft[teamIndex] <= 0}
                        >
                          Timeout
                        </Button>

                        <h3 className="font-semibold mt-4">Players:</h3>
                        <ul className="space-y-2">
                          {players[teamIndex].map((player, playerIndex) => (
                            <li key={playerIndex} className="flex items-center space-x-2">
                              {/* Player Name Input */}
                              <Input
                                value={player}
                                onChange={(e) => {
                                  const updatedPlayers = [...players];
                                  updatedPlayers[teamIndex][playerIndex] = e.target.value;
                                  setPlayers(updatedPlayers);
                                }}
                                placeholder={`P${playerIndex + 1}`}
                                className="w-32"
                              />

                              {/* Show Serve button ONLY for Position 1 (index 0) */}
                              {playerIndex === 0 && (
                                <Button size="small" onClick={() => addServe(teamIndex, player)}>
                                  Serve
                                </Button>
                              )}

                              {/* Substitution input */}
                              <Input
                                type="text"
                                placeholder="Sub Player"
                                onBlur={(e) => {
                                  const newPlayer = e.target.value;
                                  if (newPlayer) {
                                    substitutePlayer(teamIndex, playerIndex, newPlayer);
                                    e.target.value = '';
                                  }
                                }}
                                className="w-32"
                              />
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

            </div>
          </CardContent>
        </Card>

      </Grid>

      <Grid>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Box sx={{ maxHeight: 700 }}>
              {/* Match History */}
              <Typography variant="h6" gutterBottom>
                Match History
              </Typography>

              <TableContainer
                component={Paper}
                sx={{ maxHeight: 600, overflowY: 'auto' }} // ✅ SCROLLABLE BODY
              >
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell align="center"
                        sx={{ width: '33.3%', backgroundColor: '#f5f5f5', fontWeight: 'bold' }}
                      >
                        {teamNames[0]}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ width: '33.3%', backgroundColor: '#f5f5f5', fontWeight: 'bold' }}
                      >
                        Timestamp
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ width: '33.3%', backgroundColor: '#f5f5f5', fontWeight: 'bold' }}
                      >
                        {teamNames[1]}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(() => {
                      const allEvents: { time: string; category: string; team: number; details: string }[] = [];

                      scoreHistory.forEach(h => {
                        allEvents.push({
                          time: h.time,
                          category: 'Score',
                          team: h.team,
                          details: `Scored 1 point to ${h.score} points`
                        });
                      });

                      rotationHistory.forEach((rotations, teamIndex) => {
                        rotations.forEach(h => {
                          allEvents.push({
                            time: h.time,
                            category: 'Rotation',
                            team: teamIndex,
                            details: `[${h.rotation.join('; ')}]`
                          });
                        });
                      });

                      substitutionHistory.forEach(h => {
                        allEvents.push({
                          time: h.time,
                          category: 'Substitution',
                          team: h.team,
                          details: `${h.oldPlayer} ➔ ${h.newPlayer} Position ${h.position}`
                        });
                      });

                      servingHistory.forEach(h => {
                        allEvents.push({
                          time: h.time,
                          category: 'Serving',
                          team: h.team,
                          details: `${h.player} served`
                        });
                      });

                      timeoutHistory.forEach(h => {
                        allEvents.push({
                          time: h.time,
                          category: 'Timeout',
                          team: h.team,
                          details: `Timeout for ${timeoutDuration} seconds`
                        });
                      });

                      // Sort by time
                      allEvents.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

                      return allEvents.map((event, idx) => (
                        // <tr key={idx} className="border-b">
                        //   <td className="px-4 py-2 text-left align-top">
                        //     {event.team === 0 && event.details}
                        //   </td>
                        //   <td className="px-4 py-2 text-center text-gray-500 font-mono align-top">
                        //     [{event.time}]
                        //   </td>
                        //   <td className="px-4 py-2 text-left align-top">
                        //     {event.team === 1 && event.details}
                        //   </td>
                        // </tr>
                        <TableRow key={idx}>
                          <TableCell align="center" sx={{ width: '33.3%' }}>
                            {event.team === 0 ? event.details : ''}
                          </TableCell>
                          <TableCell align="center" sx={{ width: '33.3%' }}>
                            {event.time.includes(' ') ? (
                              <>
                                {event.time.split(' ')[0]}
                                <br />
                                {event.time.split(' ')[1]}
                              </>
                            ) : (
                              event.time
                            )}
                          </TableCell>
                          <TableCell align="center" sx={{ width: '33.3%' }}>
                            {event.team === 1 ? event.details : ''}
                          </TableCell>
                        </TableRow>
                      ));
                    })()}

                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>


    </Box>
  );
}
