"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Calendar, Target, Settings, Clock } from "lucide-react"
import {
  getTeams,
  getMatches,
  getPlayers,
  calculateLeagueTable,
  getChampionships,
  getActiveChampionship,
  getMatchGoals,
} from "@/lib/database"
import { AdminPanel } from "@/components/admin-panel"
import { CupTournament } from "@/components/cup-tournament"
import type { Team, Match, Player, Championship, MatchGoal } from "@/lib/supabase"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TeamDisplay } from "@/components/team-display"

export default function KSLigaSite() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminPassword, setAdminPassword] = useState("")

  const [teams, setTeams] = useState<Team[]>([])
  const [table, setTable] = useState<any[]>([])
  const [calendar, setCalendar] = useState<Match[]>([])
  const [results, setResults] = useState<Match[]>([])
  const [scorers, setScorers] = useState<Player[]>([])
  const [matchGoals, setMatchGoals] = useState<{ [key: number]: MatchGoal[] }>({})
  const [loading, setLoading] = useState(true)

  const [currentChampionshipId, setCurrentChampionshipId] = useState<number | null>(null)
  const [championships, setChampionships] = useState<Championship[]>([])
  const [currentChampionship, setCurrentChampionship] = useState<Championship | null>(null)

  // Load initial data (championships list)
  useEffect(() => {
    loadInitialData()
  }, [])

  // Load championship-specific data when championship changes
  useEffect(() => {
    if (currentChampionshipId) {
      loadDataForChampionship(currentChampionshipId)
    }
  }, [currentChampionshipId])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      console.log("Loading initial data...")

      const [championshipsData, activeChampionship] = await Promise.all([getChampionships(), getActiveChampionship()])

      console.log("Championships loaded:", championshipsData)
      console.log("Active championship:", activeChampionship)

      setChampionships(championshipsData)

      // Set the current championship
      const championshipId = activeChampionship?.id || championshipsData[0]?.id
      if (championshipId) {
        console.log("Setting current championship to:", championshipId)
        setCurrentChampionshipId(championshipId)
      } else {
        // Немає чемпіонатів, але все одно завершуємо завантаження
        console.log("No championships found")
        setCurrentChampionshipId(null)
      }
    } catch (error) {
      console.error("Error loading initial data:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadDataForChampionship = async (championshipId: number) => {
    try {
      setLoading(true)
      console.log("Loading data for championship:", championshipId)

      const [teamsData, matchesData, playersData, tableData] = await Promise.all([
        getTeams(championshipId),
        getMatches(championshipId),
        getPlayers(championshipId),
        calculateLeagueTable(championshipId),
      ])

      console.log("Loaded teams:", teamsData)
      console.log("Loaded matches:", matchesData)
      console.log("Loaded players:", playersData)

      setTeams(teamsData)
      setTable(tableData)
      setCalendar(matchesData.filter((m) => !m.is_finished))
      setResults(matchesData.filter((m) => m.is_finished))
      setScorers(playersData)

      // Set current championship info
      const championship = championships.find((c) => c.id === championshipId)
      setCurrentChampionship(championship || null)

      // Load match goals for finished matches
      const finishedMatches = matchesData.filter((m) => m.is_finished)
      const goalsData: { [key: number]: MatchGoal[] } = {}

      for (const match of finishedMatches) {
        try {
          const goals = await getMatchGoals(match.id)
          goalsData[match.id] = goals
        } catch (error) {
          console.error(`Error loading goals for match ${match.id}:`, error)
          goalsData[match.id] = []
        }
      }

      setMatchGoals(goalsData)
    } catch (error) {
      console.error("Error loading championship data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleGoalsUpdated = async () => {
    // Reload match goals when they are updated
    if (currentChampionshipId) {
      await loadDataForChampionship(currentChampionshipId)
    }
  }

  const getTeamLogo = (teamName: string): string => {
    const team = teams.find((t) => t.name === teamName)
    return team?.logo || "/placeholder.svg?height=32&width=32"
  }

  const handleLogin = () => {
    if (adminPassword === "ks2025") {
      setIsAdmin(true)
      setAdminPassword("")
    } else {
      alert("Невірний пароль")
    }
  }

  const getPositionColor = (position: number) => {
    if (position === 1) return "bg-yellow-100 border-yellow-300"
    if (position <= 3) return "bg-green-50 border-green-200"
    return "bg-white"
  }

  const handleChampionshipChange = (value: string) => {
    const newChampionshipId = Number.parseInt(value)
    console.log("Championship changed to:", newChampionshipId)
    setCurrentChampionshipId(newChampionshipId)
  }

  // Показуємо завантаження тільки на початку
  if (loading && championships.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-andrii-50 to-andrii-800 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-700 2">KS Liga</div>
          <div className="text-lg">Завантаження...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-andrii-50 to-andrii-800">
      {/* Header - Mobile Optimized */}
      <header className="bg-gradient-to-r from-blue-600 to-andrii-800 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-666 sm:py-666 text-center">
          <div className="flex items-center justify-center gap-2 sm:gap-4 mb-666">
            <img src="/images/ks-logo.png" alt="KS TV Logo" className="h-666 sm:h-666 w-auto object-contain" />
            <h1 className="text-2xl sm:text-4xl font-bold">KS Liga</h1>
          </div>
          <p className="text-yellow-200 text-sm sm:text-lg">KSTV.online – Транслюй футбол онлайн!</p>
          {championships.length > 1 && currentChampionshipId && (
            <div className="mt-666">
              <Select value={currentChampionshipId.toString()} onValueChange={handleChampionshipChange}>
                <SelectTrigger className="w-full max-w-64 mx-auto bg-white text-black">
                  <SelectValue placeholder="Оберіть чемпіонат" />
                </SelectTrigger>
                <SelectContent>
                  {championships.map((championship) => (
                    <SelectItem key={championship.id} value={championship.id.toString()}>
                      {championship.name} ({championship.season})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-2 sm:p-4 space-y-4 sm:space-y-8">
        {/* Якщо немає чемпіонатів, показуємо повідомлення */}
        {championships.length === 0 ? (
          <div className="text-center py-8 sm:py-12 px-4">
            <div className="text-lg sm:text-xl text-gray-600 mb-666">Немає створених чемпіонатів</div>
            <div className="text-gray-500 mb-6 sm:mb-8 text-sm sm:text-base">
              Увійдіть в адмін-панель, щоб створити перший чемпіонат
            </div>

            {/* Адмін-панель для створення першого чемпіонату */}
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700 justify-center text-lg sm:text-xl">
                  <Settings className="h-5 w-5 sm:h-6 sm:w-6" />
                  Адмін-панель
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!isAdmin ? (
                  <div className="space-y-4">
                    <Input
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Введіть пароль"
                      onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                      className="text-base" // Prevent zoom on iOS
                    />
                    <Button onClick={handleLogin} className="w-full">
                      Увійти
                    </Button>
                  </div>
                ) : (
                  <AdminPanel
                    onLogout={() => setIsAdmin(false)}
                    currentChampionshipId={currentChampionshipId || 0}
                    onChampionshipChange={(id) => {
                      setCurrentChampionshipId(id)
                      // Перезавантажуємо дані після створення першого чемпіонату
                      loadInitialData()
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        ) : loading ? (
          <div className="text-center py-8">
            <div className="text-lg">Завантаження даних чемпіонату...</div>
          </div>
        ) : (
          <>
            {/* Main Content Tabs - Mobile Optimized */}
            <Tabs defaultValue={currentChampionship?.tournament_type === "cup" ? "cup" : "table"} className="w-full">
              <TabsList className="grid w-full grid-cols-5 h-auto">
                {currentChampionship?.tournament_type === "league" && (
                  <TabsTrigger value="table" className="text-xs sm:text-sm px-1 sm:px-3 py-2">
                    <span className="hidden sm:inline">Турнірна таблиця</span>
                    <span className="sm:hidden">Таблиця</span>
                  </TabsTrigger>
                )}
                {currentChampionship?.tournament_type === "cup" && (
                  <TabsTrigger value="cup" className="text-xs sm:text-sm px-1 sm:px-3 py-2">
                    <span className="hidden sm:inline">Кубковий турнір</span>
                    <span className="sm:hidden">Кубок</span>
                  </TabsTrigger>
                )}
                <TabsTrigger value="calendar" className="text-xs sm:text-sm px-1 sm:px-3 py-2">
                  <span className="hidden sm:inline">Календар матчів</span>
                  <span className="sm:hidden">Календар</span>
                </TabsTrigger>
                <TabsTrigger value="results" className="text-xs sm:text-sm px-1 sm:px-3 py-2">
                  <span className="hidden sm:inline">Результати</span>
                  <span className="sm:hidden">Результати</span>
                </TabsTrigger>
                <TabsTrigger value="scorers" className="text-xs sm:text-sm px-1 sm:px-3 py-2">
                  <span className="hidden sm:inline">Бомбардири</span>
                  <span className="sm:hidden">Голи</span>
                </TabsTrigger>
                <TabsTrigger value="admin" className="text-xs sm:text-sm px-1 sm:px-3 py-2">
                  <span className="hidden sm:inline">Адмін-панель</span>
                  <span className="sm:hidden">Адмін</span>
                </TabsTrigger>
              </TabsList>

              {/* Tournament Table Tab - Mobile Optimized */}
              {currentChampionship?.tournament_type === "league" && (
                <TabsContent value="table" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-blue-700 text-lg sm:text-xl">
                        <Trophy className="h-5 w-5 sm:h-6 sm:w-6" />
                        Турнірна таблиця
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 sm:p-6">
                      {table.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          Немає даних для відображення турнірної таблиці
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs sm:text-sm">
                            <thead>
                              <tr className="bg-yellow-100 border-b">
                                <th className="text-left p-1 sm:p-3 font-semibold">#</th>
                                <th className="text-left p-1 sm:p-3 font-semibold min-w-[120px]">Команда</th>
                                <th className="text-center p-1 sm:p-3 font-semibold">І</th>
                                <th className="text-center p-1 sm:p-3 font-semibold">В</th>
                                <th className="text-center p-1 sm:p-3 font-semibold">Н</th>
                                <th className="text-center p-1 sm:p-3 font-semibold">П</th>
                                <th className="text-center p-1 sm:p-3 font-semibold">З</th>
                                <th className="text-center p-1 sm:p-3 font-semibold">П</th>
                                <th className="text-center p-1 sm:p-3 font-semibold">О</th>
                              </tr>
                            </thead>
                            <tbody>
                              {table.map((team, index) => (
                                <tr key={index} className={`border-b hover:bg-gray-50 ${getPositionColor(index + 1)}`}>
                                  <td className="p-1 sm:p-3 font-semibold">{index + 1}</td>
                                  <td className="p-1 sm:p-3">
                                    <TeamDisplay teamName={team.name} teamLogo={getTeamLogo(team.name)} size="sm" />
                                  </td>
                                  <td className="text-center p-1 sm:p-3">{team.games}</td>
                                  <td className="text-center p-1 sm:p-3 text-green-600 font-semibold">{team.wins}</td>
                                  <td className="text-center p-1 sm:p-3 text-yellow-600 font-semibold">{team.draws}</td>
                                  <td className="text-center p-1 sm:p-3 text-red-600 font-semibold">{team.losses}</td>
                                  <td className="text-center p-1 sm:p-3">{team.gf}</td>
                                  <td className="text-center p-1 sm:p-3">{team.ga}</td>
                                  <td className="text-center p-1 sm:p-3 font-bold text-blue-700">{team.pts}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {/* Cup Tournament Tab */}
              {currentChampionship?.tournament_type === "cup" && currentChampionshipId && (
                <TabsContent value="cup" className="space-y-4">
                  <CupTournament championshipId={currentChampionshipId} />
                </TabsContent>
              )}

              {/* Calendar Tab - Mobile Optimized */}
              <TabsContent value="calendar" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-700 text-lg sm:text-xl">
                      <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />
                      Календар матчів
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-2 sm:p-6">
                    {calendar.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">Немає запланованих матчів</div>
                    ) : (
                      [...new Set(calendar.map((m) => m.round))].map((round) => (
                        <div key={round}>
                          <Badge variant="outline" className="mb-2 text-xs sm:text-sm">
                            {currentChampionship?.tournament_type === "cup"
                              ? calendar.find((m) => m.round === round)?.cup_stage || `Тур ${round}`
                              : `Тур ${round}`}
                          </Badge>
                          <div className="space-y-2">
                            {calendar
                              .filter((m) => m.round === round)
                              .map((match, index) => (
                                <div key={index} className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="text-xs sm:text-sm text-gray-600 flex items-center gap-1 sm:gap-2">
                                      {match.date}
                                      {match.match_time && (
                                        <span className="flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          {match.match_time}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <TeamDisplay
                                        teamName={match.home_team}
                                        teamLogo={getTeamLogo(match.home_team)}
                                        size="sm"
                                      />
                                    </div>
                                    <span className="text-gray-500 mx-2 font-bold text-sm">VS</span>
                                    <div className="flex-1 flex justify-end">
                                      <TeamDisplay
                                        teamName={match.away_team}
                                        teamLogo={getTeamLogo(match.away_team)}
                                        size="sm"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Results Tab - Mobile Optimized */}
              <TabsContent value="results" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-700 text-lg sm:text-xl">
                      <Trophy className="h-5 w-5 sm:h-6 sm:w-6" />
                      Результати матчів
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-2 sm:p-6">
                    {results.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">Немає завершених матчів</div>
                    ) : (
                      [...new Set(results.map((r) => r.round))].map((round) => (
                        <div key={round}>
                          <Badge variant="outline" className="mb-2 text-xs sm:text-sm">
                            {currentChampionship?.tournament_type === "cup"
                              ? results.find((r) => r.round === round)?.cup_stage || `Тур ${round}`
                              : `Тур ${round}`}
                          </Badge>
                          <div className="space-y-2">
                            {results
                              .filter((r) => r.round === round)
                              .map((result, index) => (
                                <div
                                  key={index}
                                  className="bg-green-50 p-3 sm:p-4 rounded-lg border-l-4 border-green-400"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="text-xs sm:text-sm text-gray-600 flex items-center gap-1 sm:gap-2">
                                      {result.date}
                                      {result.match_time && (
                                        <span className="flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          {result.match_time}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3">
                                    <div className="flex-1">
                                      <TeamDisplay
                                        teamName={result.home_team}
                                        teamLogo={getTeamLogo(result.home_team)}
                                        size="sm"
                                      />
                                    </div>
                                    <div className="bg-white px-2 sm:px-3 py-1 rounded font-bold text-green-900 min-w-[50px] sm:min-w-[60px] text-center text-sm sm:text-base">
                                      {result.home_score} — {result.away_score}
                                    </div>
                                    <div className="flex-1 flex justify-end">
                                      <TeamDisplay
                                        teamName={result.away_team}
                                        teamLogo={getTeamLogo(result.away_team)}
                                        size="sm"
                                      />
                                    </div>
                                  </div>

                                  {/* Match Goals - Mobile Optimized */}
                                  {matchGoals[result.id] && matchGoals[result.id].length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-green-200">
                                      <div className="text-xs sm:text-sm font-semibold text-green-800 mb-2">
                                        Автори голів:
                                      </div>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                                        <div>
                                          <div className="font-medium text-green-700">{result.home_team}:</div>
                                          {matchGoals[result.id]
                                            .filter((goal) => goal.team_name === result.home_team)
                                            .map((goal, idx) => (
                                              <div key={idx} className="ml-2">
                                                {goal.player_name} {goal.minute && `(${goal.minute}')`}
                                                {goal.goal_type === "penalty" && " (пен.)"}
                                                {goal.goal_type === "own_goal" && " (автогол)"}
                                              </div>
                                            ))}
                                        </div>
                                        <div>
                                          <div className="font-medium text-green-700">{result.away_team}:</div>
                                          {matchGoals[result.id]
                                            .filter((goal) => goal.team_name === result.away_team)
                                            .map((goal, idx) => (
                                              <div key={idx} className="ml-2">
                                                {goal.player_name} {goal.minute && `(${goal.minute}')`}
                                                {goal.goal_type === "penalty" && " (пен.)"}
                                                {goal.goal_type === "own_goal" && " (автогол)"}
                                              </div>
                                            ))}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Top Scorers Tab - Mobile Optimized */}
              <TabsContent value="scorers" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-700 text-lg sm:text-xl">
                      <Target className="h-5 w-5 sm:h-6 sm:w-6" />
                      Бомбардири
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 sm:p-6">
                    {scorers.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">Немає даних про бомбардирів</div>
                    ) : (
                      <div className="space-y-2 sm:space-y-3">
                        {scorers.map((scorer, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                              <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0">
                                {index + 1}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-sm sm:text-base truncate">{scorer.name}</div>
                                <div className="text-xs sm:text-sm text-gray-600">
                                  <TeamDisplay
                                    teamName={scorer.team}
                                    teamLogo={getTeamLogo(scorer.team)}
                                    size="sm"
                                    showName={true}
                                  />
                                </div>
                              </div>
                            </div>
                            <Badge
                              variant="secondary"
                              className="bg-yellow-100 text-yellow-800 text-xs sm:text-sm flex-shrink-0"
                            >
                              {scorer.goals} гол{scorer.goals !== 1 ? "и" : ""}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Admin Panel Tab */}
              <TabsContent value="admin" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-700 text-lg sm:text-xl">
                      <Settings className="h-5 w-5 sm:h-6 sm:w-6" />
                      Адмін-панель
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 sm:p-6">
                    {!isAdmin ? (
                      <div className="space-y-4">
                        <Input
                          type="password"
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          placeholder="Введіть пароль"
                          onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                          className="text-base" // Prevent zoom on iOS
                        />
                        <Button onClick={handleLogin} className="w-full">
                          Увійти
                        </Button>
                      </div>
                    ) : (
                      <AdminPanel
                        onLogout={() => setIsAdmin(false)}
                        currentChampionshipId={currentChampionshipId || 0}
                        onChampionshipChange={(id) => {
                          setCurrentChampionshipId(id)
                        }}
                      />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  )
}
