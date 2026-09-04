import React from 'react';
import { Code2, Search, Vote, Shield, Skull, Eye, Terminal, Cpu, CheckCircle } from 'lucide-react';

export function HowItWorksSection() {
  const roles = [
    {
      id: 'civilian',
      title: 'CIVILIAN',
      subtitle: 'Innocent Developer',
      icon: '🛡️',
      color: 'border-blue-500/40 bg-blue-950/20 text-blue-300',
      glow: '[box-shadow:0_0_25px_rgba(59,130,246,0.2)]',
      badgeColor: 'bg-blue-900/40 text-blue-400 border-blue-500/40',
      description: 'Collaborate with the team to repair failing unit tests and maintain pipeline stability.',
      objectives: [
        'Fix failing public & hidden unit test suites',
        'Pass 100% of test assertions to secure Civilians Victory',
        'Identify & vote out suspicious saboteurs during discussion'
      ]
    },
    {
      id: 'detective',
      title: 'DETECTIVE',
      subtitle: 'QA Auditor',
      icon: '🕵️',
      color: 'border-purple-500/40 bg-purple-950/20 text-purple-300',
      glow: '[box-shadow:0_0_25px_rgba(168,85,247,0.2)]',
      badgeColor: 'bg-purple-900/40 text-purple-400 border-purple-500/40',
      description: 'Equipped with audit tools to inspect commit diffs and detect unauthorized code modifications.',
      objectives: [
        'Inspect audit timelines for suspicious line edits',
        'Analyze hidden test failure logs and syntax anomalies',
        'Lead discussion phase to guide Civilians to victory'
      ]
    },
    {
      id: 'mafia',
      title: 'MAFIA',
      subtitle: 'Code Saboteur',
      icon: '💀',
      color: 'border-red-500/40 bg-red-950/20 text-red-300',
      glow: '[box-shadow:0_0_25px_rgba(239,68,68,0.2)]',
      badgeColor: 'bg-red-900/40 text-red-400 border-red-500/40',
      description: 'Infiltrate the dev team, secretly inject subtle bugs, and sabotage unit test execution.',
      objectives: [
        'Inject stealthy off-by-one errors & logic bugs',
        'Distort calculations without triggering immediate alarm',
        'Blend in during code review and survive voting rounds'
      ]
    }
  ];

  const phases = [
    {
      step: '01',
      title: 'SPRINT PHASE',
      icon: Code2,
      desc: 'Coding window active! Work together in the shared browser IDE editor to debug code files and run unit test suites.'
    },
    {
      step: '02',
      title: 'AUDIT & DISCUSSION',
      icon: Search,
      desc: 'Code editor locks! Review suspicious code diffs, inspect audit logs, and debate who injected failing test assertions.'
    },
    {
      step: '03',
      title: 'VOTING & ELIMINATION',
      icon: Vote,
      desc: 'Cast secret votes to eliminate suspected Saboteurs or skip. The player with majority votes is eliminated!'
    }
  ];

  return (
    <section id="how-it-works" className="relative py-20 px-4 max-w-6xl mx-auto border-t border-purple-500/20">
      {/* Section Header */}
      <div className="text-center mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 text-[10px] tracking-widest text-purple-300 border border-purple-500/30 bg-purple-900/30 rounded-full font-pixel">
          <Terminal className="w-3.5 h-3.5 text-purple-400" />
          GAMEPLAY RULES & MECHANICS
        </div>
        <h2 className="font-pixel text-3xl md:text-5xl text-white tracking-wider [text-shadow:0_0_25px_rgba(168,85,247,0.5)]">
          HOW CODE MAFIA WORKS
        </h2>
        <p className="text-purple-300/60 text-sm max-w-xl mx-auto font-sans leading-relaxed">
          A high-stakes social deduction debugging game where software developers and covert saboteurs clash over a failing codebase.
        </p>
      </div>

      {/* 3-Phase Gameplay Loop */}
      <div className="mb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {phases.map((p) => {
            const IconComponent = p.icon;
            return (
              <div
                key={p.step}
                className="relative p-6 bg-[#150926] border border-purple-500/30 rounded-lg shadow-lg hover:border-purple-400/60 transition-all group"
              >
                <div className="flex justify-between items-center mb-4">
                  <span className="font-pixel text-2xl text-purple-500/40 group-hover:text-purple-400 transition-colors">
                    {p.step}
                  </span>
                  <div className="p-2.5 bg-purple-900/40 border border-purple-500/30 rounded-md text-purple-300">
                    <IconComponent className="w-5 h-5" />
                  </div>
                </div>
                <h4 className="font-pixel text-sm text-white mb-2 tracking-wider">{p.title}</h4>
                <p className="text-purple-300/70 text-xs font-sans leading-relaxed">{p.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Character Roles & Objectives */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {roles.map((r) => (
            <div
              key={r.id}
              className={`p-8 rounded-lg border flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${r.color} ${r.glow}`}
            >
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-4xl">{r.icon}</span>
                  <span className={`px-2.5 py-1 text-[9px] font-pixel rounded border ${r.badgeColor}`}>
                    {r.subtitle}
                  </span>
                </div>
                <h4 className="font-pixel text-xl text-white mb-2 tracking-wider">{r.title}</h4>
                <p className="text-xs font-sans leading-relaxed text-purple-200/80 mb-6">{r.description}</p>
              </div>

              <div className="pt-4 border-t border-purple-500/20 space-y-2">
                <span className="font-pixel text-[9px] text-purple-400 uppercase tracking-wider block mb-1">
                  PRIMARY OBJECTIVES:
                </span>
                {r.objectives.map((obj, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-[11px] font-sans text-purple-200/90">
                    <CheckCircle className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                    <span>{obj}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
