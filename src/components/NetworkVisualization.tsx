import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { ZoomIn, ZoomOut, Maximize2, Activity, Link as LinkIcon, Clock, Brain } from "lucide-react";
import { networkData as mockNetworkData } from "../mockData";
import { supabase } from "../lib/supabaseClient";
import { motion } from "motion/react";
import { cn } from "../lib/utils";

export default function NetworkVisualization() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [liveMetrics, setLiveMetrics] = useState({
    throughput: 1.2,
    activeLinks: 24,
    latency: 12
  });
  const [networkData, setNetworkData] = useState<any>(mockNetworkData);
  const [threats, setThreats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [correlationLogs, setCorrelationLogs] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: devices } = await supabase.from('devices').select('*');
        const { data: threatData } = await supabase.from('threats').select('*').eq('status', 'active');
        
        if (threatData) setThreats(threatData);

        if (devices && devices.length > 0) {
          const newNodes = devices.map(d => ({
            id: d.id.toString(),
            name: d.name,
            type: d.type === 'gateway' ? 'gateway' : 'device',
            status: d.status,
            isCorrelated: threatData?.some(t => t.target === d.name || t.source === d.ip)
          }));

          const newLinks: any[] = [];
          const gateways = newNodes.filter(n => n.type === 'gateway');
          const sensors = newNodes.filter(n => n.type === 'device');

          sensors.forEach((s, i) => {
            const targetGateway = gateways[i % gateways.length] || gateways[0];
            if (targetGateway) {
              newLinks.push({
                source: s.id,
                target: targetGateway.id,
                traffic: Math.floor(Math.random() * 100) + 20,
                isThreatPath: s.isCorrelated || (targetGateway as any).isCorrelated
              });
            }
          });

          setNetworkData({ nodes: newNodes, links: newLinks });
        }
      } catch (e) {
        setNetworkData(mockNetworkData);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Real-time correlation logs
    const logInterval = setInterval(() => {
      const messages = [
        "Analyzing lateral movement patterns...",
        "Correlation Engine: Node B-04 showing anomalous handshake.",
        "Multi-vector sync confirmed: Gateway 01 to Sensor Edge.",
        "Heuristic Match: T1071.001 detected on encrypted channel."
      ];
      setCorrelationLogs(prev => [...prev.slice(-3), messages[Math.floor(Math.random() * messages.length)]]);
    }, 5000);

    return () => clearInterval(logInterval);
  }, []);

  useEffect(() => {
    if (!svgRef.current || isLoading) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight || 600;

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height]);

    svg.selectAll("*").remove();

    // Deep copy to avoid mutating original state
    const nodes = networkData.nodes.map((d: any) => ({ ...d }));
    const links = networkData.links.map((d: any) => ({ ...d }));

    const isMobile = width < 768;
    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(isMobile ? 80 : 150))
      .force("charge", d3.forceManyBody().strength(isMobile ? -200 : -500))
      .force("center", d3.forceCenter(width / 2, height / 2));

    // Zoom Behavior
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 5])
      .on("zoom", (event) => {
        mainContainer.attr("transform", event.transform);
      });

    svg.call(zoomBehavior as any);
    const mainContainer = svg.append("g").attr("class", "main-container");

    const link = mainContainer.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", (d: any) => d.isThreatPath ? 2 : Math.max(1, d.traffic / 20))
      .attr("stroke", (d: any) => d.isThreatPath ? "#EF4444" : "rgba(255, 255, 255, 0.08)")
      .attr("stroke-dasharray", (d: any) => d.isThreatPath ? "4,2" : "none")
      .attr("class", (d: any) => d.isThreatPath ? "animate-pulse" : "");

    const node = mainContainer.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .call(d3.drag<any, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Exposed Zoom Controls
    (window as any).zoomTo = (scale: number) => {
      svg.transition().duration(750).call(zoomBehavior.scaleBy as any, scale);
    };
    (window as any).resetZoom = () => {
      svg.transition().duration(750).call(zoomBehavior.transform as any, d3.zoomIdentity);
    };

    // Outer ring for status indicator
    const outerRing = node.append("circle")
      .attr("r", (d: any) => d.type === "gateway" ? 14 : 10)
      .attr("fill", "none")
      .attr("stroke-width", 1)
      .attr("stroke-opacity", 0.4);

    // Main node circle
    const innerCircle = node.append("circle")
      .attr("r", (d: any) => d.type === "gateway" ? 8 : 4);

    // Status Badge (Small circle at bottom right)
    const statusBadge = node.append("circle")
      .attr("cx", (d: any) => d.type === "gateway" ? 8 : 4)
      .attr("cy", (d: any) => d.type === "gateway" ? 8 : 4)
      .attr("r", 3)
      .attr("stroke", "#17111d") // Match background exactly
      .attr("stroke-width", 1);

    node.append("text")
      .attr("dx", 12)
      .attr("dy", 4)
      .text((d: any) => d.name)
      .attr("fill", "#A1A8B8")
      .attr("font-size", "10px")
      .attr("font-family", "Space Grotesk")
      .attr("font-weight", "500");

    const updateNodeColors = () => {
      const getColor = (status: string) => {
        if (status === "online") return "#00fbfb"; // Cyan
        if (status === "warning") return "#ffaaf7"; // Purple
        if (status === "isolated") return "#ffb4ab"; // Danger
        if (status === "offline") return "#A1A8B8"; // Muted
        return "#2c2c2e";
      };

      const getFilter = (status: string) => {
        if (status === "online") return "drop-shadow(0 0 8px rgba(0, 251, 251, 0.5))";
        if (status === "warning") return "drop-shadow(0 0 8px rgba(255, 170, 247, 0.5))";
        if (status === "isolated") return "drop-shadow(0 0 8px rgba(255, 180, 171, 0.5))";
        return "none";
      };

      outerRing
        .transition().duration(500)
        .attr("stroke", (d: any) => getColor(d.status))
        .attr("stroke-dasharray", (d: any) => d.status === "isolated" ? "2,2" : "none");

      innerCircle
        .transition().duration(500)
        .attr("fill", (d: any) => getColor(d.status))
        .attr("filter", (d: any) => getFilter(d.status));

      statusBadge
        .transition().duration(500)
        .attr("fill", (d: any) => getColor(d.status));
    };

    // Initial color set
    updateNodeColors();

    const handleResize = () => {
      if (!svgRef.current) return;
      const width = svgRef.current.clientWidth;
      const height = svgRef.current.clientHeight || 600;
      
      svg.attr("viewBox", [0, 0, width, height]);
      simulation.force("center", d3.forceCenter(width / 2, height / 2));
      simulation.alpha(0.3).restart();
    };

    window.addEventListener("resize", handleResize);

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    // Real-time metrics simulation
    const interval = setInterval(() => {
      setLiveMetrics(prev => ({
        throughput: Math.max(0.5, Math.min(5.0, prev.throughput + (Math.random() * 0.4 - 0.2))),
        activeLinks: Math.max(10, Math.min(50, prev.activeLinks + Math.floor(Math.random() * 5 - 2))),
        latency: Math.max(5, Math.min(150, prev.latency + Math.floor(Math.random() * 10 - 5)))
      }));
    }, 3000);

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
      clearInterval(interval);
      window.removeEventListener("resize", handleResize);
    };
  }, [networkData, isLoading]);

  return (
    <div className="space-y-8 md:space-y-10 pb-20 max-w-[1400px] mx-auto px-4 md:px-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <h2 className="text-2xl md:text-[32px] font-bold tracking-tight text-white mb-1 font-headline uppercase">Network Topology</h2>
          <p className="text-text-muted font-black text-[10px] uppercase tracking-[0.3em] font-label">Interactive visualization of IIoT device communication paths</p>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3">
          <div className="flex items-center gap-2 px-2.5 md:px-4 py-1.5 md:py-2 bg-bg-secondary/50 border border-white/[0.06] rounded-xl font-label">
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-success rounded-full shadow-[0_0_10px_rgba(0,251,251,0.4)]" />
            <span className="text-[8px] md:text-[10px] text-text-muted uppercase font-black tracking-widest">Online</span>
          </div>
          <div className="flex items-center gap-2 px-2.5 md:px-4 py-1.5 md:py-2 bg-bg-secondary/50 border border-white/[0.06] rounded-xl font-label">
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-warning rounded-full shadow-[0_0_10px_rgba(255,170,247,0.4)]" />
            <span className="text-[8px] md:text-[10px] text-text-muted uppercase font-black tracking-widest">Warning</span>
          </div>
          <div className="flex items-center gap-2 px-2.5 md:px-4 py-1.5 md:py-2 bg-bg-secondary/50 border border-white/[0.06] rounded-xl font-label">
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-danger rounded-full shadow-[0_0_10px_rgba(255,180,171,0.4)]" />
            <span className="text-[8px] md:text-[10px] text-text-muted uppercase font-black tracking-widest">Isolated</span>
          </div>
          <div className="flex items-center gap-2 px-2.5 md:px-4 py-1.5 md:py-2 bg-bg-secondary/50 border border-white/[0.06] rounded-xl font-label">
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-text-muted rounded-full" />
            <span className="text-[8px] md:text-[10px] text-text-muted uppercase font-black tracking-widest">Offline</span>
          </div>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card overflow-hidden relative h-[600px] md:h-[800px] group"
      >
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg-primary/50 backdrop-blur-md z-[30]">
             <div className="w-10 h-10 border-4 border-accent-blue/10 border-t-accent-blue rounded-full animate-spin mb-4" />
             <p className="text-[10px] font-bold text-accent-blue uppercase tracking-widest animate-pulse font-label">Mapping Network Nodes...</p>
          </div>
        ) : (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(79,140,255,0.05))] via-transparent to-transparent pointer-events-none group-hover:bg-[radial-gradient(circle_at_center,_rgba(79,140,255,0.08))] transition-all duration-1000" />
            
            {/* Zoom Controls Overlay */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-30">
               <button 
                 onClick={() => (window as any).zoomTo(1.2)}
                 className="w-10 h-10 glass-card flex items-center justify-center hover:bg-white/5 text-text-muted hover:text-accent-blue transition-all"
               >
                 <ZoomIn className="w-5 h-5" />
               </button>
               <button 
                 onClick={() => (window as any).zoomTo(0.8)}
                 className="w-10 h-10 glass-card flex items-center justify-center hover:bg-white/5 text-text-muted hover:text-accent-blue transition-all"
               >
                 <ZoomOut className="w-5 h-5" />
               </button>
               <button 
                 onClick={() => (window as any).resetZoom()}
                 className="w-10 h-10 glass-card flex items-center justify-center hover:bg-white/5 text-text-muted hover:text-accent-blue transition-all"
               >
                 <Maximize2 className="w-5 h-5" />
               </button>
            </div>

            <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing relative z-10" />
          </>
        )}
        
        <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 p-4 md:p-6 glass-card relative z-20 overflow-hidden group/info max-w-[calc(100%-2rem)] md:max-w-none">
          <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/5 to-transparent opacity-0 group-hover/info:opacity-100 transition-opacity duration-700" />
          <h4 className="text-[9px] md:text-xs font-black text-white mb-3 md:mb-6 uppercase tracking-[0.2em] relative z-10 flex items-center gap-2 font-label">
            <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
            Live Traffic Analysis
          </h4>
          <div className="space-y-2 md:space-y-4 relative z-10">
            <div className="flex justify-between gap-6 md:gap-12 items-center">
              <span className="text-[8px] md:text-[10px] text-text-muted uppercase font-bold tracking-widest">Throughput</span>
              <span className="text-[9px] md:text-xs text-accent-blue font-mono font-bold transition-all">{liveMetrics.throughput.toFixed(2)} GB/s</span>
            </div>
            <div className="flex justify-between gap-6 md:gap-12 items-center">
              <span className="text-[8px] md:text-[10px] text-text-muted uppercase font-bold tracking-widest">Active Links</span>
              <span className="text-[9px] md:text-xs text-accent-blue font-mono font-bold transition-all">{liveMetrics.activeLinks}</span>
            </div>
            <div className="flex justify-between gap-6 md:gap-12 items-center">
              <span className="text-[8px] md:text-[10px] text-text-muted uppercase font-bold tracking-widest">Latency</span>
              <span className={cn(
                "text-[9px] md:text-xs font-mono font-bold transition-all",
                liveMetrics.latency > 100 ? "text-danger" : liveMetrics.latency > 50 ? "text-warning" : "text-success"
              )}>{liveMetrics.latency}ms</span>
            </div>
          </div>

          {/* New Correlation Terminal Overlay */}
          <div className="mt-6 pt-6 border-t border-white/5 space-y-2">
             <p className="text-[8px] font-black text-accent-blue uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                <Brain className="w-3 h-3" /> Multi-Vector Correlation
             </p>
             <div className="space-y-1">
                {correlationLogs.map((log, i) => (
                  <motion.p 
                    key={i} 
                    initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}
                    className="text-[8px] font-mono text-text-muted leading-tight"
                  >
                    {">"} {log}
                  </motion.p>
                ))}
             </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
