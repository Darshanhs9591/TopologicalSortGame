class TopologicalSortValidator {
    constructor() {
        this.graph = new Map();
        this.vertices = new Set();
        this.fromVertexSelect = document.getElementById('from-vertex-select');
        this.addVertexInput = document.getElementById('add-vertex-input');
        this.toVertexInput = document.getElementById('to-vertex-input');
        this.edgesContainer = document.getElementById('edges-container');
        this.sortingResult = document.getElementById('sorting-result');
        this.graphSvg = d3.select('#graph-svg');
        this.scoreDisplay = document.getElementById('score');
        this.streakDisplay = document.getElementById('streak');
        this.score = 0;
        this.streak = 0;
        this.loadScore();

        // Add event listeners for enter key
        this.addVertexInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addVertex();
        });
        this.toVertexInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addEdge();
        });
    }

    loadScore() {
        const savedScore = localStorage.getItem('topoSortScore');
        const savedStreak = localStorage.getItem('topoSortStreak');
        if (savedScore) this.score = parseInt(savedScore);
        if (savedStreak) this.streak = parseInt(savedStreak);
        this.updateScoreDisplay();
    }

    saveScore() {
        localStorage.setItem('topoSortScore', this.score.toString());
        localStorage.setItem('topoSortStreak', this.streak.toString());
    }

    updateScore(correct, points) {
        if (correct) {
            this.score += points;
            this.streak++;
        } else {
            this.streak = 0;
        }
        this.updateScoreDisplay();
        this.saveScore();
    }

    resetScore() {
        this.score = 0;
        this.streak = 0;
        this.updateScoreDisplay();
        this.saveScore();
    }

    updateScoreDisplay() {
        this.scoreDisplay.textContent = this.score;
        this.streakDisplay.textContent = this.streak;
    }

    addVertex() {
        const vertex = this.addVertexInput.value.trim().toUpperCase();
        if (vertex && !this.vertices.has(vertex)) {
            this.vertices.add(vertex);
            this.graph.set(vertex, []);
            this.updateVertexSelector();
            this.renderGraph();
            this.sortingResult.innerHTML = '';
        }
        this.addVertexInput.value = '';
    }

    updateVertexSelector() {
        this.fromVertexSelect.innerHTML = '<option value="">From Vertex</option>';
        Array.from(this.vertices).sort().forEach(vertex => {
            const option = document.createElement('option');
            option.value = vertex;
            option.textContent = vertex;
            this.fromVertexSelect.appendChild(option);
        });
    }

    addEdge() {
        const fromVertex = this.fromVertexSelect.value;
        const toVertex = this.toVertexInput.value.trim().toUpperCase();
        if (fromVertex && toVertex && this.vertices.has(toVertex) && 
            fromVertex !== toVertex && !this.graph.get(fromVertex).includes(toVertex)) {
            this.graph.get(fromVertex).push(toVertex);
            this.updateEdgesDisplay();
            this.renderGraph();
            this.sortingResult.innerHTML = '';
        }
        this.toVertexInput.value = '';
    }

    updateEdgesDisplay() {
        this.edgesContainer.innerHTML = '';
        const edges = [];
        this.graph.forEach((neighbors, vertex) => {
            neighbors.forEach(neighbor => {
                edges.push(`${vertex} → ${neighbor}`);
            });
        });
        edges.sort().forEach(edge => {
            const edgeDiv = document.createElement('div');
            edgeDiv.className = 'edge';
            edgeDiv.textContent = edge;
            this.edgesContainer.appendChild(edgeDiv);
        });
    }

    renderGraph() {
        this.graphSvg.selectAll('*').remove();
        const nodes = Array.from(this.vertices).map(v => ({ id: v }));
        const links = [];
        this.graph.forEach((neighbors, vertex) => {
            neighbors.forEach(neighbor => links.push({ source: vertex, target: neighbor }));
        });

        // Add arrow markers
        this.graphSvg.append('defs').append('marker')
            .attr('id', 'arrowhead')
            .attr('viewBox', '-0 -5 10 10')
            .attr('refX', 20)
            .attr('refY', 0)
            .attr('orient', 'auto')
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#ecf0f1');

        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links).id(d => d.id).distance(100))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(this.graphSvg.node().clientWidth / 2, 200));

        const link = this.graphSvg.append('g')
            .selectAll('line')
            .data(links)
            .enter().append('line')
            .attr('stroke', '#ecf0f1')
            .attr('stroke-width', 2)
            .attr('marker-end', 'url(#arrowhead)');

        const node = this.graphSvg.append('g')
            .selectAll('circle')
            .data(nodes)
            .enter().append('circle')
            .attr('r', 15)
            .attr('fill', '#3498db')
            .call(d3.drag()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended));

        const text = this.graphSvg.append('g')
            .selectAll('text')
            .data(nodes)
            .enter().append('text')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .attr('fill', '#ecf0f1')
            .attr('font-weight', 'bold')
            .text(d => d.id);

        simulation.on('tick', () => {
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => {
                    const dx = d.target.x - d.source.x;
                    const dy = d.target.y - d.source.y;
                    const length = Math.sqrt(dx * dx + dy * dy);
                    return d.source.x + (dx * (length - 25)) / length;
                })
                .attr('y2', d => {
                    const dx = d.target.x - d.source.x;
                    const dy = d.target.y - d.source.y;
                    const length = Math.sqrt(dx * dx + dy * dy);
                    return d.source.y + (dy * (length - 25)) / length;
                });

            node
                .attr('cx', d => d.x = Math.max(15, Math.min(this.graphSvg.node().clientWidth - 15, d.x)))
                .attr('cy', d => d.y = Math.max(15, Math.min(385, d.y)));

            text
                .attr('x', d => d.x)
                .attr('y', d => d.y);
        });

        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }
    }

    generateRandomGraph() {
        const numVertices = Math.floor(Math.random() * 4) + 4; // Random vertices: 4-7
        const vertices = Array.from({ length: numVertices }, (_, i) => `V${i + 1}`);
        this.vertices.clear();
        this.graph.clear();
        vertices.forEach(vertex => {
            this.vertices.add(vertex);
            this.graph.set(vertex, []);
        });

        // Generate edges ensuring no cycles
        for (let i = 0; i < numVertices - 1; i++) {
            for (let j = i + 1; j < numVertices; j++) {
                if (Math.random() < 0.5) {
                    this.graph.get(vertices[i]).push(vertices[j]);
                }
            }
        }

        this.updateVertexSelector();
        this.updateEdgesDisplay();
        this.renderGraph();
        this.sortingResult.innerHTML = '';
    }

    clearGraph() {
        this.vertices.clear();
        this.graph.clear();
        this.updateVertexSelector();
        this.updateEdgesDisplay();
        this.renderGraph();
        this.sortingResult.innerHTML = '';
    }

    validateTopologicalSort() {
        const userSortInput = prompt('Enter the proposed topological sort (comma-separated vertices):');
        if (!userSortInput) {
            this.displayResult(false, 'No input provided.');
            this.updateScore(false, 0);
            return;
        }

        const userSort = userSortInput.split(',').map(v => v.trim().toUpperCase());
        
        // Check if all vertices are included
        const userSet = new Set(userSort);
        const missing = [...this.vertices].filter(v => !userSet.has(v));
        if (missing.length) {
            this.displayResult(false, `Missing vertices: ${missing.join(', ')}`);
            this.updateScore(false, 0);
            return;
        }

        // Check if all vertices are valid
        const invalid = userSort.filter(v => !this.vertices.has(v));
        if (invalid.length) {
            this.displayResult(false, `Invalid vertices: ${invalid.join(', ')}`);
            this.updateScore(false, 0);
            return;
        }

        // Check if each vertex appears exactly once
        if (userSort.length !== this.vertices.size) {
            this.displayResult(false, 'Each vertex must appear exactly once');
            this.updateScore(false, 0);
            return;
        }

        // Check if the ordering respects all edges
        const invalid_edges = [];
        for (const [v, neighbors] of this.graph.entries()) {
            neighbors.forEach(n => {
                if (userSort.indexOf(v) > userSort.indexOf(n)) {
                    invalid_edges.push(`${v} → ${n}`);
                }
            });
        }

        if (invalid_edges.length) {
            this.displayResult(false, `Invalid ordering for edges: ${invalid_edges.join(', ')}`);
            this.updateScore(false, 0);
            return;
        }

        // If we get here, the sort is valid
        const points = 100 + (this.streak * 10); // Bonus points for streak
        this.updateScore(true, points);
        this.displayResult(true, `Correct! Score: +${points} points (including ${this.streak * 10} streak bonus)`);
    }

    displayResult(correct, message) {
        this.sortingResult.innerHTML = `<div class="${correct ? 'win-message' : 'loss-message'}">${message}</div>`;
    }
}

// Initialize the game
const game = new TopologicalSortValidator();
