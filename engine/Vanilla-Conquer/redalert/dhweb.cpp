/*
** Donghyun-Re web shell glue (GPL-3.0-or-later, same as the rest of this tree).
*/
#include "function.h"
#include "dhweb.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#endif

DhStartType DhStart = {0, 0, 0, 1, 2, 5000, 10, 2, 1, 2};

#ifdef __EMSCRIPTEN__
int DhMouseInside = 0;
extern "C" EMSCRIPTEN_KEEPALIVE void dh_mouse(int inside)
{
    DhMouseInside = inside ? 1 : 0;
}
#else
int DhMouseInside = 1;
#endif

static int Dh_Clamp(int v, int lo, int hi)
{
    return v < lo ? lo : (v > hi ? hi : v);
}

void Dh_Parse(int argc, char** argv)
{
    for (int i = 1; i < argc; i++) {
        const char* a = argv[i];
        if (!strncmp(a, "-DH=", 4) || !strncmp(a, "-dh=", 4)) {
            int v[7] = {1, 2, 5000, 10, 2, 1, 2};
            sscanf(a + 4, "%d,%d,%d,%d,%d,%d,%d", &v[0], &v[1], &v[2], &v[3], &v[4], &v[5], &v[6]);
            DhStart.Active = 1;
            DhStart.Me = Dh_Clamp(v[0], 1, 5);
            DhStart.Foe = Dh_Clamp(v[1], 1, 5);
            DhStart.Credits = Dh_Clamp(v[2], 500, 10000);
            DhStart.Tech = Dh_Clamp(v[3], 1, MPLAYER_BUILD_LEVEL_MAX);
            DhStart.Diff = Dh_Clamp(v[4], 1, 3);
            DhStart.Map = Dh_Clamp(v[5], 1, 99);
            DhStart.Units = Dh_Clamp(v[6], 0, 12);
        } else if (!strcmp(a, "-DHLOAD") || !strcmp(a, "-dhload")) {
            DhStart.Active = 1;
            DhStart.Load = 1;
        }
    }
}

void Dh_Notify(const char* what, int a, int b)
{
#ifdef __EMSCRIPTEN__
    EM_ASM({ if (Module.dhEvent) Module.dhEvent(UTF8ToString($0), $1, $2); }, what, a, b);
#else
    (void)what;
    (void)a;
    (void)b;
#endif
}

void Dh_Halt(void)
{
#ifdef __EMSCRIPTEN__
    for (;;) {
        emscripten_sleep(1000);
    }
#endif
}

/*
** Does what the skirmish dialog does when OK is pressed, with the page's numbers.
*/
void Dh_Setup_Skirmish(void)
{
    static HousesType const _houses[5] = {HOUSE_USSR, HOUSE_ENGLAND, HOUSE_UKRAINE, HOUSE_GERMANY, HOUSE_FRANCE};

    Session.Type = GAME_SKIRMISH;
    Special.IsCaptureTheFlag = false;
    Session.Options.Credits = DhStart.Credits;
    Session.Options.Bases = true;
    Session.Options.Tiberium = Rule.IsMPTiberiumGrow;
    Session.Options.Goodies = Rule.IsMPCrates;
    Session.Options.AIPlayers = 1;
    Special.IsShadowGrow = Rule.IsMPShadowGrow;
    Session.Options.UnitCount = DhStart.Units;
    Special.IsTGrowth = Rule.IsTGrowth = Special.IsTSpread = Rule.IsTSpread = Session.Options.Tiberium;
    BuildLevel = DhStart.Tech;

    Clear_Vector(&Session.Players);
    Session.House = _houses[DhStart.Me - 1];
    Session.ColorIdx = Session.PrefColor;
    Session.NumPlayers = 1;
    Session.Options.ScenarioIndex = 0;
    Session.ScenarioIsOfficial = false;
    Scen.Scenario = 0;
    snprintf(Scen.ScenarioName, sizeof(Scen.ScenarioName), "DHRE%02d.MPR", DhStart.Map);

    NodeNameType* who = new NodeNameType;
    strcpy(who->Name, Session.Handle[0] ? Session.Handle : "DONGHYUN");
    who->Player.House = Session.House;
    who->Player.Color = Session.ColorIdx;
    who->Player.ProcessTime = -1;
    Session.Players.Add(who);

    /* Same pairs the dialog's three-step slider gives: 0, 2, 4. */
    switch (DhStart.Diff) {
    case 1:
        Scen.CDifficulty = DIFF_HARD;
        Scen.Difficulty = DIFF_EASY;
        break;
    default:
    case 2:
        Scen.CDifficulty = DIFF_NORMAL;
        Scen.Difficulty = DIFF_NORMAL;
        break;
    case 3:
        Scen.CDifficulty = DIFF_EASY;
        Scen.Difficulty = DIFF_HARD;
        break;
    }
}

#ifdef __EMSCRIPTEN__
/* For the page and the tests: one multiplier of one country, times 1000. */
extern "C" EMSCRIPTEN_KEEPALIVE int dh_house_bias(int house, int what)
{
    static HousesType const _houses[5] = {HOUSE_USSR, HOUSE_ENGLAND, HOUSE_UKRAINE, HOUSE_GERMANY, HOUSE_FRANCE};
    if (house < 1 || house > 5)
        return -1;
    HouseTypeClass const& h = HouseTypeClass::As_Reference(_houses[house - 1]);
    fixed f = 1;
    switch (what) {
    case 0: f = h.FirepowerBias; break;
    case 1: f = h.GroundspeedBias; break;
    case 2: f = h.AirspeedBias; break;
    case 3: f = h.ArmorBias; break;
    case 4: f = h.ROFBias; break;
    case 5: f = h.CostBias; break;
    case 6: f = h.BuildSpeedBias; break;
    default: return -1;
    }
    return (int)(f * 1000);
}

/* For the tests: a few numbers of the running battle. */
extern "C" EMSCRIPTEN_KEEPALIVE int dh_peek(int what)
{
    switch (what) {
    case 0: return (int)Frame;
    case 1: return PlayerPtr ? (int)PlayerPtr->Available_Money() : -1;
    case 2: return PlayerPtr ? (int)PlayerPtr->ActLike : -1;
    case 3: return PlayerPtr ? (int)PlayerPtr->CurBuildings : -1;
    case 4: return PlayerPtr ? (int)PlayerPtr->CurUnits : -1;
    case 5: return (int)Session.Type;
    case 6: return (int)BuildLevel;
    case 7: return (int)Scen.CDifficulty * 10 + (int)Scen.Difficulty;
    case 8: return (int)Options.GameSpeed;
    case 9: return (int)Map.MapCellWidth * 1000 + (int)Map.MapCellHeight;
    case 10: {
        int n = 0;
        for (int i = 0; i < Buildings.Count(); i++) {
            BuildingClass* b = Buildings.Ptr(i);
            if (b && !b->IsInLimbo && b->House == PlayerPtr) {
                n++;
            }
        }
        return n;
    }
    case 11: return PlayerPtr ? (int)PlayerPtr->Power : -1;
    case 12: return PlayerPtr ? (int)PlayerPtr->Drain : -1;
    case 13: return PlayerPtr ? (int)PlayerPtr->IsDefeated : -1;
    case 14: return (int)Coord_XCell(Map.TacticalCoord) * 1000 + (int)Coord_YCell(Map.TacticalCoord);
    case 15: return (int)Session.Options.UnitCount;
    case 16: return PlayerPtr ? (int)PlayerPtr->CurInfantry : -1;
    case 17: return (int)Scen.Waypoint[0];
    }
    if (what >= 300 && what < 310) {
        /* For the tests: where on the 640x400 screen the player's construction vehicle (300,301) or first building (302,303) is. */
        COORDINATE c = 0;
        if (what < 302) {
            for (int i = 0; i < Units.Count(); i++) {
                UnitClass* u = Units.Ptr(i);
                if (u && !u->IsInLimbo && u->House == PlayerPtr && *u == UNIT_MCV) {
                    c = u->Center_Coord();
                    break;
                }
            }
        } else if (what < 304) {
            for (int i = 0; i < Buildings.Count(); i++) {
                BuildingClass* b = Buildings.Ptr(i);
                if (b && !b->IsInLimbo && b->House == PlayerPtr) {
                    c = b->Center_Coord();
                    break;
                }
            }
        }
        int x = 0, y = 0;
        if (!c || !Map.Coord_To_Pixel(c, x, y)) {
            return -1;
        }
        return (what & 1) ? y + Map.TacPixelY : x + Map.TacPixelX;
    }
    if (what >= 100 && what < 200) {
        /* 100+k: k-th house other than the player's that is in the game */
        int k = what - 100;
        for (int i = 0; i < Houses.Count(); i++) {
            HouseClass* h = Houses.Ptr(i);
            if (h && h != PlayerPtr && h->IsStarted && !h->IsHuman) {
                if (k % 10 == 0) {
                    switch (k / 10) {
                    case 0: return (int)h->ActLike;
                    case 1: return (int)h->Available_Money();
                    case 2: return (int)h->CurBuildings;
                    case 3: return (int)h->CurUnits;
                    case 4: return (int)h->CurInfantry;
                    case 5: return (int)h->IsDefeated;
                    }
                }
                k--;
            }
        }
    }
    return -1;
}
#endif

#ifdef __EMSCRIPTEN__
/* For the map tools and the tests: one colour of the game palette as 0xRRGGBB (6-bit parts scaled to 8). */
extern "C" EMSCRIPTEN_KEEPALIVE int dh_palette(int i)
{
    if (i < 0 || i > 255)
        return -1;
    RGBClass const& c = GamePalette[i];
    int r = c.Red_Component(), g = c.Green_Component(), b = c.Blue_Component();
    return (r << 16) | (g << 8) | b;
}

/* For the page and the tests: numbers from the game's rule file. Fractions come times 1000. */
extern "C" EMSCRIPTEN_KEEPALIVE int dh_rule(int what)
{
    switch (what) {
    case 0: return Rule.GoldValue;
    case 1: return Rule.GemValue;
    case 2: return Rule.BailCount;
    case 3: return (int)(Rule.GrowthRate * 1000);
    case 4: return Rule.MPDefaultMoney;
    case 5: return Rule.MPMaxMoney;
    case 6: return Rule.MaxIQ;
    case 7: return (int)(Rule.RefundPercent * 1000);
    case 8: return (int)(Rule.RepairPercent * 1000);
    case 9: return Rule.RepairStep;
    case 10: return (int)(Rule.GameSpeedBias * 1000);
    case 11: return (int)(Rule.SurvivorFraction * 1000);
    case 12: return Rule.IsFineDifficulty ? 1 : 0;
    case 13: return Rule.IsMPTiberiumGrow ? 1 : 0;
    case 14: return Rule.IsMPCrates ? 1 : 0;
    case 15: return Rule.IsMPShadowGrow ? 1 : 0;
    case 16: return (int)(Rule.BuildSpeedBias * 1000);
    case 17: return Rule.MinDamage;
    case 18: return Rule.MaxDamage;
    case 19: return (int)(Rule.OreDumpRate);
    }
    if (what >= 100 && what < 400) {
        /* 100+10*d+k: difficulty row d (0 easy, 1 normal, 2 hard), k-th multiplier */
        int d = (what - 100) / 10, k = (what - 100) % 10;
        if (d > 2)
            return -1;
        switch (k) {
        case 0: return (int)(Rule.Diff[d].FirepowerBias * 1000);
        case 1: return (int)(Rule.Diff[d].GroundspeedBias * 1000);
        case 2: return (int)(Rule.Diff[d].AirspeedBias * 1000);
        case 3: return (int)(Rule.Diff[d].ArmorBias * 1000);
        case 4: return (int)(Rule.Diff[d].ROFBias * 1000);
        case 5: return (int)(Rule.Diff[d].CostBias * 1000);
        case 6: return (int)(Rule.Diff[d].BuildSpeedBias * 1000);
        case 7: return (int)(Rule.Diff[d].RepairDelay * 1000);
        case 8: return (int)(Rule.Diff[d].BuildDelay * 1000);
        }
    }
    return -1;
}
#endif

#ifdef __EMSCRIPTEN__
/* For the tests only: 1 = the computer's house gives up, 2 = the player's house gives up (same path as Resign). */
extern "C" EMSCRIPTEN_KEEPALIVE int dh_test(int what)
{
    if (what == 2 && PlayerPtr) {
        return PlayerPtr->Flag_To_Die() ? 1 : 0;
    }
    if (what == 3 && PlayerPtr) {
        /* lift the shroud, to look at a whole map */
        PlayerPtr->IsVisionary = true;
        for (CELL cell = 0; cell < MAP_CELL_TOTAL; cell++) {
            Map.Map_Cell(cell, PlayerPtr);
        }
        Map.Flag_To_Redraw(true);
        return 1;
    }
    if (what >= 100000) {
        /* put the top-left corner of the view on a cell */
        Map.Set_Tactical_Position(Cell_Coord((CELL)(what - 100000)));
        Map.Flag_To_Redraw(true);
        return 1;
    }
    if (what == 1) {
        for (int i = 0; i < Houses.Count(); i++) {
            HouseClass* h = Houses.Ptr(i);
            if (h && h != PlayerPtr && h->IsStarted && !h->IsHuman && !h->IsDefeated) {
                return h->Flag_To_Die() ? 1 : 0;
            }
        }
    }
    return -1;
}
/* Type tables, for the page's unit list: kind 0 building, 1 unit, 2 infantry, 3 vessel, 4 aircraft. */
static TechnoTypeClass const* _dh_type_ptr(int kind, int id)
{
    if (id < 0) {
        return NULL;
    }
    switch (kind) {
    case 0: return id < STRUCT_COUNT ? &BuildingTypeClass::As_Reference((StructType)id) : NULL;
    case 1: return id < UNIT_COUNT ? &UnitTypeClass::As_Reference((UnitType)id) : NULL;
    case 2: return id < INFANTRY_COUNT ? &InfantryTypeClass::As_Reference((InfantryType)id) : NULL;
    case 3: return id < VESSEL_COUNT ? &VesselTypeClass::As_Reference((VesselType)id) : NULL;
    case 4: return id < AIRCRAFT_COUNT ? &AircraftTypeClass::As_Reference((AircraftType)id) : NULL;
    }
    return NULL;
}

extern "C" EMSCRIPTEN_KEEPALIVE const char* dh_type_name(int kind, int id, int full)
{
    TechnoTypeClass const* t = _dh_type_ptr(kind, id);
    if (!t) {
        return "";
    }
    return full ? Text_String(t->Full_Name()) : t->IniName;
}

extern "C" EMSCRIPTEN_KEEPALIVE int dh_type(int kind, int id, int field)
{
    TechnoTypeClass const* t = _dh_type_ptr(kind, id);
    if (!t) {
        return -2;
    }
    switch (field) {
    case 0: return t->Ownable;
    case 1: return (int)t->Level;
    case 2: return t->Cost;
    case 3: return t->MaxStrength;
    case 4: return (int)t->MaxSpeed;
    case 5: return (int)t->Armor;
    case 6: return t->PrimaryWeapon ? t->PrimaryWeapon->Attack : 0;
    case 7: return t->PrimaryWeapon ? t->PrimaryWeapon->ROF : 0;
    case 8: return t->PrimaryWeapon ? (int)t->PrimaryWeapon->Range : 0;
    case 9: return t->SightRange;
    case 10: return kind == 0 ? ((BuildingTypeClass const*)t)->Power : 0;
    case 11: return kind == 0 ? ((BuildingTypeClass const*)t)->Drain : 0;
    case 12: return t->PrimaryWeapon && t->PrimaryWeapon->WarheadPtr ? (int)(t->PrimaryWeapon->WarheadPtr->Modifier[t->Armor] * 1000) : 0;
    case 13: return t->Prerequisite;
    case 14: return t->PrimaryWeapon && t->PrimaryWeapon->WarheadPtr ? (int)t->PrimaryWeapon->WarheadPtr->ID : -1;
    }
    return -1;
}

/* Warhead table: field 0..4 = damage modifier against armor none/wood/light/heavy/concrete (x1000), 5 = spread factor. */
extern "C" EMSCRIPTEN_KEEPALIVE int dh_warhead(int id, int field)
{
    if (id < 0 || id >= WARHEAD_COUNT) {
        return -2;
    }
    WarheadTypeClass const* w = WarheadTypeClass::As_Pointer((WarheadType)id);
    if (!w) {
        return -2;
    }
    if (field >= 0 && field < ARMOR_COUNT) {
        return (int)(w->Modifier[field] * 1000);
    }
    if (field == 5) {
        return w->SpreadFactor;
    }
    return -1;
}

extern "C" EMSCRIPTEN_KEEPALIVE const char* dh_warhead_name(int id)
{
    if (id < 0 || id >= WARHEAD_COUNT) {
        return "";
    }
    WarheadTypeClass const* w = WarheadTypeClass::As_Pointer((WarheadType)id);
    return w ? w->Name() : "";
}
#endif

