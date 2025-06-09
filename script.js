async function analyzeProfile() {
  const username = document.getElementById('username').value.trim();
  const profileDiv = document.getElementById('profile');
  profileDiv.innerHTML = 'Loading...';

  try {
    const [userRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${username}`),
      fetch(`https://api.github.com/users/${username}/repos?per_page=100`)
    ]);

    const user = await userRes.json();
    const repos = await reposRes.json();

    if (user.message === "Not Found") {
      profileDiv.innerHTML = "❌ User not found.";
      return;
    }

    const totalStars = repos.reduce((sum, r) => sum + r.stargazers_count, 0);
    const totalForks = repos.reduce((sum, r) => sum + r.forks_count, 0);
    const topStarred = [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 5);
    const mostForked = [...repos].sort((a, b) => b.forks_count - a.forks_count)[0];

    const langMap = {};
    repos.forEach(repo => {
      if (repo.language) {
        langMap[repo.language] = (langMap[repo.language] || 0) + 1;
      }
    });

    const langEntries = Object.entries(langMap).sort((a, b) => b[1] - a[1]);
    const totalLangs = langEntries.reduce((sum, [_, count]) => sum + count, 0);
    const langStats = langEntries
      .map(([lang, count]) => `${lang}: ${((count / totalLangs) * 100).toFixed(1)}%`)
      .join('<br>');

    const createdDate = new Date(user.created_at).toDateString();
    const accountAge = Math.floor((Date.now() - new Date(user.created_at)) / (1000 * 60 * 60 * 24));

    profileDiv.innerHTML = `
      <img src="${user.avatar_url}" alt="${user.login}" />
      <h2>${user.name || user.login}</h2>
      <p>${user.bio || "No bio available."}</p>
      <p>📁 Public Repos: ${user.public_repos}</p>
      <p>⭐ Total Stars: ${totalStars}</p>
      <p>🍴 Total Forks: ${totalForks}</p>
      <p>🕰️ Account Created: ${createdDate} (${accountAge} days ago)</p>
      <p>🧠 Language Usage:<br>${langStats || "No languages detected."}</p>

      <h3>🔥 Top 5 Starred Repos:</h3>
      <ul>
        ${topStarred.map(repo => `<li><a href="${repo.html_url}" target="_blank">${repo.name} (${repo.stargazers_count} ⭐)</a></li>`).join('')}
      </ul>

      <h3>🚀 Most Forked Repo:</h3>
      <p><a href="${mostForked.html_url}" target="_blank">${mostForked.name}</a> (${mostForked.forks_count} forks)</p>
    `;

    // Add detailed repo cards for all repos
    const repoCards = repos.map(repo => `
      <div class="repo-card">
        <h4><a href="${repo.html_url}" target="_blank">${repo.name}</a></h4>
        <p>${repo.description || "No description"}</p>
        <ul>
          <li>⭐ Stars: ${repo.stargazers_count}</li>
          <li>🍴 Forks: ${repo.forks_count}</li>
          <li>🧠 Language: ${repo.language || "N/A"}</li>
          <li>📦 Size: ${(repo.size / 1024).toFixed(2)} MB</li>
          <li>📜 License: ${repo.license ? repo.license.spdx_id : "None"}</li>
          <li>🕒 Last Push: ${new Date(repo.pushed_at).toLocaleDateString()}</li>
          ${repo.topics && repo.topics.length > 0 ? `<li>🏷️ Topics: ${repo.topics.join(", ")}</li>` : ""}
        </ul>
      </div>
    `).join('');

    profileDiv.innerHTML += `
      <h3>📂 All Public Repositories (${repos.length})</h3>
      ${repoCards}
    `;

  } catch (err) {
    profileDiv.innerHTML = "⚠️ Error loading data.";
    console.error(err);
  }
}



